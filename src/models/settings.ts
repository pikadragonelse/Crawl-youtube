export interface DataSettings {
  folderPath: string;
  proxy: {
    type: 'ip2world' | '360proxy';
    key: string;
    link: string;
    password: string;
  };
  quantityUpload: number;
}
