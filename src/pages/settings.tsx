import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  notification,
  Row,
  Select,
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useEffect } from 'react';
import { FolderOpenOutlined, SaveOutlined } from '@ant-design/icons';
import { ResponseElectron } from '../models/response';
import { DataSettings } from '../models/settings';

export const Settings = () => {
  const [form] = useForm();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-settings');

    window.electron.ipcRenderer.once('get-settings', (res) => {
      const dataSettings = res as DataSettings;
      form.setFieldsValue({
        folderPath: dataSettings.folderPath,
        proxy: dataSettings.proxy,
        quantityUpload: dataSettings.quantityUpload,
      });
    });
  }, []);

  const handleClick = () => {
    window.electron.ipcRenderer.sendMessage('select-path-save-data');
  };

  useEffect(() => {
    const removeSelectPathSaveData = window.electron.ipcRenderer.on(
      'select-path-save-data',
      (res) => {
        const folderPath = res;
        form.setFieldValue('folderPath', folderPath);
      },
    );

    const removeSaveSettings = window.electron.ipcRenderer.on(
      'save-settings',
      (res) => {
        const response = res as ResponseElectron;
        api[response.status]({
          message: response.message,
          placement: 'bottomRight',
        });
      },
    );

    return () => {
      removeSelectPathSaveData();
      removeSaveSettings();
    };
  }, []);

  const saveSettings = (data: DataSettings) => {
    window.electron.ipcRenderer.sendMessage('save-settings', data);
  };

  return (
    <div className="flex-1 h-full p-4 overflow-auto">
      {contextHolder}
      <div className="w-fit mx-auto">
        <h1 className="text-3xl font-medium mb-10 bg-gradient-to-r from-red-600 to-orange-600 inline-block text-transparent bg-clip-text pb-1">
          Cài đặt
        </h1>
      </div>
      <div className="">
        <Form
          form={form}
          layout="vertical"
          onFinish={(data: DataSettings) => saveSettings(data)}
        >
          <Row>
            <Col span={19}>
              <Form.Item<DataSettings>
                name="folderPath"
                label="Địa chỉ lưu trữ dữ liệu tải về"
              >
                <Input placeholder="Nhập địa chỉ hoặc nhấn nút để chọn địa chỉ" />
              </Form.Item>
            </Col>
            <Col span={4} offset={1} className="mt-7">
              <Button
                onClick={handleClick}
                icon={<FolderOpenOutlined className="text-xl" />}
              >
                Chọn thư mục
              </Button>
            </Col>
          </Row>
          <Form.Item<DataSettings>
            name={['proxy', 'type']}
            label="Nhà cung cấp proxy"
          >
            <Select
              options={[
                { label: 'IP2WORLD', value: 'ip2world' },
                { label: 'TM Proxy', value: 'tmproxy' },
              ]}
            />
          </Form.Item>
          <Form.Item<DataSettings> name={['proxy', 'key']} label="Proxy key">
            <Input placeholder="Nhập key" />
          </Form.Item>
          <Form.Item<DataSettings>
            name={['proxy', 'link']}
            label="Đường dẫn proxy"
          >
            <Input placeholder="Nhập đường dẫn" />
          </Form.Item>
          <Form.Item<DataSettings>
            name={['proxy', 'password']}
            label="Mật khẩu proxy"
          >
            <Input placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Row justify={'end'}>
            <Form.Item>
              <Button
                htmlType="submit"
                type="primary"
                icon={<SaveOutlined className="text-xl" />}
              >
                Lưu cài đặt
              </Button>
            </Form.Item>
          </Row>
        </Form>
      </div>
    </div>
  );
};
