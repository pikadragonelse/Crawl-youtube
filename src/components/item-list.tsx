import { Button } from 'antd';
import React from 'react';

export type ItemList = { src?: string };
export const ItemList: React.FC<ItemList> = ({ src }) => {
  return (
    <div className="relative w-64 rounded-xl overflow-hidden group">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover group-hover:scale-110 transition-all"
      />
      <div className="absolute z-10 flex justify-between w-full px-2 py-4 bottom-0 bg-black/50 backdrop-blur text-zinc-50 items-center">
        <div className="">
          <h3 className="text-lg font-bold">Title</h3>
          <p>13:12</p>
        </div>
        <Button size="small">Lấy link</Button>
      </div>
    </div>
  );
};
