'use client';

import React, { useState } from 'react';
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

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: string,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: keyof Earthquake | 'closestCity') => ({
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
    onFilter: (value: string, record: Earthquake) => {
      if (dataIndex === 'closestCity') {
        return record.location_properties.closestCity.name
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      }
      
      if (!record[dataIndex as keyof Earthquake]) return false;
      
      return record[dataIndex as keyof Earthquake]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase());
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
  });

  const columns: TableProps<Earthquake>['columns'] = [
    {
      title: 'Date & Time',
      dataIndex: 'date_time',
      key: 'date_time',
      sorter: (a, b) => dayjs(a.date_time).unix() - dayjs(b.date_time).unix(),
      defaultSortOrder: 'descend',
      render: (text) => (
        <Tooltip title={dayjs(text).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(text).format('MM/DD HH:mm')}
        </Tooltip>
      ),
      width: '12%',
    },
    {
      title: 'Location',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[150px]">{text}</div>
        </Tooltip>
      ),
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
        <Tooltip title="View on map">
          <Button 
            type="text"
            shape="circle"
            icon={<EnvironmentOutlined />} 
            onClick={() => onEarthquakeSelect(record)}
          />
        </Tooltip>
      ),
      width: '8%',
    },
  ];

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
        scroll={{ x: 'max-content' }}
        size="middle"
        rowClassName={(record) => 
          record._id === selectedEarthquake?._id ? 'bg-gray-800' : ''
        }
        onRow={(record) => ({
          onClick: () => onEarthquakeSelect(record),
          className: 'cursor-pointer'
        })}
      />
    </Card>
  );
};

export default EarthquakeTable;
