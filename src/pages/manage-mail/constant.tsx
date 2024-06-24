import { TableProps } from 'antd';
import { MailInfo } from '../../models/mail';

export const columns: TableProps<MailInfo>['columns'] = [
  { title: '#', dataIndex: 'key' },
  { title: 'Mail', dataIndex: 'mail' },
  { title: 'Mật khẩu', dataIndex: 'password' },
  { title: 'Mail khôi phục', dataIndex: 'recoverMail' },
];
