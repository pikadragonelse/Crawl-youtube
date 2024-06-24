import {
  Button,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  TableProps,
  Tabs,
  Tooltip,
} from 'antd';
import React, { useState } from 'react';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { columns } from './constant';
import { MailInfo } from '../../models/mail';
import { FormImportMail } from '../../components/form-add-mail/form-import-mail';
import { FormUploadVideo } from '../../components/form-upload-video';

type ActionMailTable = {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (record: MailInfo) => void;
};

export const ManageMail = () => {
  const [dataTable, setDataTable] = useState<MailInfo[]>([]);
  const [isOpenAddMailModal, setIsOpenAddMailModal] = useState(false);
  const [isOpenAddVideoChannelModal, setIsOpenAddVideoChannelModal] =
    useState(false);
  const [selectMail, setSelectMail] = useState<MailInfo>();

  const actionColumns: TableProps<MailInfo>['columns'] = [
    ...(columns as any),
    {
      title: 'Tiện ích',
      width: 200,
      render: (_, record) => (
        <div className="flex gap-4 ">
          {actionList.map((action, index) => (
            <Tooltip title={action.tooltip}>
              <div
                key={index}
                onClick={() => action.onClick(record)}
                className="py-1 px-2 text-lg rounded-full cursor-pointer hover:bg-zinc-100 active:bg-zinc-300 transition-all"
              >
                {action.icon}
              </div>
            </Tooltip>
          ))}
        </div>
      ),
    },
  ];

  const actionList: Array<ActionMailTable> = [
    {
      icon: <PlayCircleOutlined className="text-green-500" />,
      tooltip: 'Tải video lên kênh',
      onClick: (record?: MailInfo) => {
        setSelectMail(record);
        setIsOpenAddVideoChannelModal(true);
      },
    },
    {
      icon: <EditOutlined className="text-yellow-600" />,
      tooltip: 'Chỉnh sửa thông tin',
      onClick: (record?: MailInfo) => {},
    },
    {
      icon: <DeleteOutlined className="text-red-600" />,
      tooltip: 'Xóa mail',
      onClick: (record?: MailInfo) => {},
    },
  ];

  return (
    <div className="flex-1 h-full p-4 overflow-auto">
      <Modal
        title="Thêm dữ liệu mail"
        open={isOpenAddMailModal}
        onCancel={() => setIsOpenAddMailModal(false)}
        footer={<></>}
      >
        <Tabs
          items={[
            {
              label: 'Thêm nhiều mail',
              children: (
                <FormImportMail onUploadedFile={(data) => setDataTable(data)} />
              ),
              key: 'importMail',
            },
            {
              label: 'Thêm một mail',
              children: <></>,
              key: 'singleMail',
            },
          ]}
        />
      </Modal>
      <Modal
        title="Thêm video vào kênh"
        open={isOpenAddVideoChannelModal}
        onCancel={() => setIsOpenAddVideoChannelModal(false)}
        footer={
          <Row justify={'end'}>
            <Space>
              <Button
                onClick={() => {
                  setIsOpenAddVideoChannelModal(false);
                  setSelectMail(undefined);
                }}
              >
                Từ chối
              </Button>
              <Button type="primary">Xác nhận</Button>
            </Space>
          </Row>
        }
      >
        <FormUploadVideo mailInfo={selectMail} />
      </Modal>
      <div className="w-fit mx-auto">
        <h1 className="text-3xl font-medium mb-10 bg-gradient-to-r from-red-600 to-orange-600 inline-block text-transparent bg-clip-text pb-1">
          Quản lý mail
        </h1>
      </div>
      <div className="flex">
        <div className="w-64 mb-2">
          <Input.Search
            placeholder="Tìm kiếm bằng tên mail"
            inputMode="email"
            allowClear
            enterButton
          />
        </div>
        <div className="w-fit ml-auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsOpenAddMailModal(true)}
          >
            Thêm mail
          </Button>
        </div>
      </div>
      <div className="">
        <Table columns={actionColumns} dataSource={dataTable} />
      </div>
    </div>
  );
};
