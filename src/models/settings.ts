export interface DataSettings {
  folderPath: string;
  proxy: {
    type: 'ip2world' | 'tmproxy';
    key: string;
    link: string;
    password: string;
  };
  quantityUpload: number;
}
