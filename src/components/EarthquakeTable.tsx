'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Table, Input, Button, Space } from 'antd';
import type { TableProps } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import dayjs from 'dayjs';
import { Earthquake } from '@/services/earthquakeService';
import { MagnitudeBadge, MagnitudeBar } from './ui/MagnitudeBadge';
import { relativeTime } from '@/lib/magnitude';

interface EarthquakeTableProps {
  earthquakes: Earthquake[];
  loading: boolean;
  onEarthquakeSelect: (earthquake: Earthquake) => void;
  selectedEarthquake: Earthquake | null;
}

const EarthquakeTable: React.FC<EarthquakeTableProps> = ({
  earthquakes,
  loading,
  onEarthquakeSelect,
  selectedEarthquake,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  // Tick every 30s so relative times refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = useCallback(
    (keys: string[], confirm: FilterDropdownProps['confirm'], dataIndex: string) => {
      confirm();
      setSearchText(keys[0] ?? '');
      setSearchedColumn(dataIndex);
    },
    []
  );

  const handleReset = useCallback((clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  }, []);

  const getColumnSearchProps = useCallback(
    (dataIndex: keyof Earthquake | 'closestCity') => ({
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: FilterDropdownProps) => (
        <div style={{ padding: 8, background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
          <Input
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              size="small"
              onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
              style={{ width: 84 }}
            >
              Search
            </Button>
            <Button
              size="small"
              onClick={() => clearFilters && handleReset(clearFilters)}
              style={{ width: 84 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? 'var(--accent)' : 'var(--fg-2)' }} />
      ),
      onFilter: (value: string | number | boolean | bigint, record: Earthquake) => {
        const v = String(value).toLowerCase();
        if (dataIndex === 'closestCity') {
          return record.location_properties.closestCity.name.toLowerCase().includes(v);
        }
        const field = record[dataIndex as keyof Earthquake];
        return field ? String(field).toLowerCase().includes(v) : false;
      },
      render: (text: string, record: Earthquake) => {
        const display =
          dataIndex === 'closestCity' ? record.location_properties.closestCity.name : text;
        if (searchedColumn === dataIndex && searchText) {
          return (
            <Highlighter
              highlightStyle={{ backgroundColor: 'var(--accent-dim)', color: 'var(--bg-0)', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={display ?? ''}
            />
          );
        }
        return display;
      },
    }),
    [searchText, searchedColumn, handleSearch, handleReset]
  );

  const columns = useMemo<TableProps<Earthquake>['columns']>(
    () => [
      {
        title: 'Time',
        dataIndex: 'date_time',
        key: 'date_time',
        sorter: (a, b) => dayjs(a.date_time).unix() - dayjs(b.date_time).unix(),
        defaultSortOrder: 'descend',
        render: (text: string) => (
          <div className="mono tabular-nums text-[11px]" title={dayjs(text).format('YYYY-MM-DD HH:mm:ss')}>
            <div className="text-fg-0">{relativeTime(text)}</div>
            <div className="text-fg-2 text-[10px]">{dayjs(text).format('MM-DD HH:mm')}</div>
          </div>
        ),
        width: 110,
      },
      {
        title: 'Magnitude',
        dataIndex: 'mag',
        key: 'mag',
        sorter: (a, b) => a.mag - b.mag,
        render: (mag: number) => (
          <div className="flex items-center gap-2">
            <MagnitudeBadge mag={mag} />
            <MagnitudeBar mag={mag} />
          </div>
        ),
        width: 150,
      },
      {
        title: 'Location',
        dataIndex: 'title',
        key: 'title',
        ...getColumnSearchProps('title'),
        render: (text: string) => (
          <div className="text-[12px] text-fg-0 truncate max-w-[220px]" title={text}>
            {text}
          </div>
        ),
      },
      {
        title: 'Depth',
        dataIndex: 'depth',
        key: 'depth',
        sorter: (a, b) => a.depth - b.depth,
        render: (depth: number) => (
          <span className="mono tabular-nums text-[11px] text-fg-0">
            {depth.toFixed(1)}
            <span className="text-fg-2"> km</span>
          </span>
        ),
        width: 80,
      },
      {
        title: 'Closest City',
        key: 'closestCity',
        ...getColumnSearchProps('closestCity'),
        render: (_: unknown, record: Earthquake) => (
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] text-fg-0">
              {record.location_properties.closestCity.name}
            </span>
            <span className="mono tabular-nums text-[10px] text-fg-2">
              {(record.location_properties.closestCity.distance / 1000).toFixed(1)} km
            </span>
          </div>
        ),
        sorter: (a, b) =>
          a.location_properties.closestCity.distance -
          b.location_properties.closestCity.distance,
      },
    ],
    [getColumnSearchProps]
  );

  return (
    <div className="border border-line bg-bg-1">
      <div className="flex items-center justify-between px-3 py-2 border-b border-line">
        <div className="mono text-[10px] uppercase tracking-[0.1em] text-fg-2">
          Event Log
        </div>
        <div className="mono text-[10px] text-fg-2">
          {earthquakes.length} events
        </div>
      </div>
      <Table
        rowKey="earthquake_id"
        columns={columns}
        dataSource={earthquakes}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `${total} total`,
          size: 'small',
        }}
        scroll={{ x: true }}
        size="small"
        rowClassName={(record) =>
          record.earthquake_id === selectedEarthquake?.earthquake_id
            ? 'row-selected cursor-pointer'
            : 'cursor-pointer'
        }
        onRow={(record) => ({ onClick: () => onEarthquakeSelect(record) })}
      />
    </div>
  );
};

export default EarthquakeTable;
