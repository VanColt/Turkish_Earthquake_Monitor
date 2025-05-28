'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Table, Card, Typography, Tag, Input, Button, Space, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import dayjs from 'dayjs';
import { Earthquake, getMagnitudeColor } from '@/services/earthquakeService';

const { Title } = Typography;

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
  selectedEarthquake
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  // Memoize handlers to prevent recreating functions on each render
  const handleSearch = useCallback(
    (selectedKeys: string[], confirm: FilterDropdownProps['confirm'], dataIndex: string) => {
      confirm();
      setSearchText(selectedKeys[0]);
      setSearchedColumn(dataIndex);
    },
    []
  );

  const handleReset = useCallback((clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  }, []);

  // Memoize the column search props function to prevent recreation on each render
  const getColumnSearchProps = useCallback((dataIndex: keyof Earthquake | 'closestCity') => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value: string | number | boolean | bigint, record: Earthquake) => {
      // Convert value to string for comparison
      const searchValue = String(value).toLowerCase();
      
      if (dataIndex === 'closestCity') {
        const cityName = record.location_properties.closestCity.name;
        return cityName ? cityName.toString().toLowerCase().includes(searchValue) : false;
      }
      
      const fieldValue = record[dataIndex as keyof Earthquake];
      if (!fieldValue) return false;
      
      return String(fieldValue).toLowerCase().includes(searchValue);
    },
    render: (text: string, record: Earthquake) => {
      if (dataIndex === 'closestCity') {
        text = record.location_properties.closestCity.name;
      }
      
      if (searchedColumn === dataIndex) {
        return (
          <Highlighter
            highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ''}
          />
        );
      }
      return text;
    },
  }), [searchText, searchedColumn, handleSearch, handleReset]);

  // Memoize columns to prevent recreating the array on every render
  const columns = useMemo<TableProps<Earthquake>['columns']>(() => [
    {
      title: 'Date & Time',
      dataIndex: 'date_time',
      key: 'date_time',
      sorter: (a, b) => dayjs(a.date_time).unix() - dayjs(b.date_time).unix(),
      defaultSortOrder: 'descend',
      render: (text) => (
        <span title={dayjs(text).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(text).format('MM/DD HH:mm')}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Location',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
      render: (text) => {
        // Use CSS truncation instead of Ant Design's EllipsisMeasure
        return (
          <div className="truncate max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis" title={text}>{text}</div>
        );
      },
      width: '25%',
    },
    {
      title: 'Magnitude',
      dataIndex: 'mag',
      key: 'mag',
      sorter: (a, b) => a.mag - b.mag,
      render: (mag) => (
        <Tag color={getMagnitudeColor(mag)}>
          M{mag.toFixed(1)}
        </Tag>
      ),
      width: '12%',
    },
    {
      title: 'Depth',
      dataIndex: 'depth',
      key: 'depth',
      sorter: (a, b) => a.depth - b.depth,
      render: (depth) => `${depth} km`,
      width: '10%',
    },
    {
      title: 'Closest City',
      key: 'closestCity',
      ...getColumnSearchProps('closestCity'),
      render: (_, record) => (
        <span>{record.location_properties.closestCity.name}</span>
      ),
      width: '15%',
    },
    {
      title: 'Distance',
      key: 'distance',
      render: (_, record) => (
        <span>{(record.location_properties.closestCity.distance / 1000).toFixed(1)} km</span>
      ),
      sorter: (a, b) => 
        a.location_properties.closestCity.distance - 
        b.location_properties.closestCity.distance,
      width: '10%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text"
          shape="circle"
          icon={<EnvironmentOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            onEarthquakeSelect(record);
          }}
          title="View on map"
        />
      ),
      width: '8%',
    },
  ], [getColumnSearchProps, onEarthquakeSelect]);

  return (
    <Card 
      className="h-full shadow-md bg-transparent"
      styles={{ body: { backgroundColor: 'transparent' } }}
      variant="outlined"
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={earthquakes}
        loading={loading}
        pagination={{ 
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `Total ${total} earthquakes`,
          className: 'custom-pagination'
        }}
        scroll={{ x: true }}
        size="middle"
        rowClassName={(record) => 
          record._id === selectedEarthquake?._id ? 'bg-gray-800' : ''
        }
        onRow={useMemo(() => {
          return (record: Earthquake) => ({
            onClick: () => onEarthquakeSelect(record),
            className: 'cursor-pointer'
          });
        }, [onEarthquakeSelect])}
      />
    </Card>
  );
};

export default EarthquakeTable;
