import { Button, message } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { downloadExampleTxtFileUrl } from '../../utils/create-file';
import React, { useRef } from 'react';
import { MailInfo } from '../../models/mail';

export type FormImportMail = { onUploadedFile?: (data: MailInfo[]) => void };
export const FormImportMail: React.FC<FormImportMail> = ({
  onUploadedFile = () => {},
}) => {
  const inputFileTxtRef = useRef<HTMLInputElement>(null);

  const triggerUploadTxt = () => {
    if (inputFileTxtRef && inputFileTxtRef.current) {
      inputFileTxtRef.current.click();
    }
  };

  const clearDataInput = () => {
    if (inputFileTxtRef && inputFileTxtRef.current) {
      inputFileTxtRef.current.files = null;
      inputFileTxtRef.current.value = '';
    }
  };

  const checkValidContent = (data: Array<Array<string>>) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].length < 3) {
        return false;
      }
    }
    return true;
  };

  const handleDataTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files != null && e.target.files[0] != null) {
      const fileData = e.target.files[0];
      e.preventDefault();

      let reader = new FileReader();
      reader.onload = function (e) {
        if (e.target != null) {
          let data = e.target.result as string;
          const dataWithoutCarriageReturn = data.replace(/\r/g, '');
          const lines = dataWithoutCarriageReturn.split('\n');
          const handledLines = lines.filter((line) => line.trim() !== '');
          const dataParse = handledLines.map((line) => line.split('\t'));

          const isValidContent = checkValidContent(dataParse);

          if (isValidContent === true) {
            const dataTable: MailInfo[] = [];
            dataParse.forEach((row, index) => {
              if (index > 0) {
                const mailInfo: MailInfo = {
                  key: index,
                  mail: row[0],
                  password: row[1],
                  recoverMail: row[2],
                  status: 'not upload',
                };
                dataTable.push(mailInfo);
              }
            });
            window.electron.ipcRenderer.sendMessage(
              'add-multiple-mail',
              dataTable,
            );
            onUploadedFile(dataTable);
            message.success(`Thêm thành công ${dataTable.length} mail!`);
            clearDataInput();
          }
        } else {
          clearDataInput();
        }
      };
      reader.readAsBinaryString(fileData);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <input
          type="file"
          accept=".txt"
          ref={inputFileTxtRef}
          onChange={handleDataTxt}
          hidden
        />
        <Button onClick={() => triggerUploadTxt()} className="w-44 ">
          Tải tệp .txt
        </Button>
        <Button
          href={downloadExampleTxtFileUrl()}
          download={'exampleData.txt'}
          type="link"
          className="ml-2  text-yellow-600"
          icon={<DownloadOutlined />}
        >
          Tệp mẫu.txt
        </Button>
      </div>
    </div>
  );
};
