import { TableProps, Tag } from 'antd';
import { MailInfo } from '../../models/mail';

const statusMap: Record<string, React.ReactNode> = {
  uploaded: <Tag color="green">Đã tải video lên</Tag>,
  'not upload': <Tag>Chưa tải video lên</Tag>,
  dead: <Tag color="red">Mail chết</Tag>,
  errorUploading: <Tag color="red">Có video bị chặn</Tag>,
};

export const columns: TableProps<MailInfo>['columns'] = [
  { title: '#', dataIndex: 'key' },
  { title: 'Mail', dataIndex: 'mail' },
  { title: 'Mật khẩu', dataIndex: 'password' },
  { title: 'Mail khôi phục', dataIndex: 'recoverMail' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (value) => statusMap[value],
  },
];
