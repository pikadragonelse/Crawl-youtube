import { Button, Input } from 'antd';
import axios from 'axios';
import React, { useState } from 'react';

export const FromRenderMail = () => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div>
      <Input
        placeholder="Nhập số lượng mail"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <Button>Lấy mail</Button>
    </div>
  );
};
