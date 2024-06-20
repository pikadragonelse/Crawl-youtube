import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ManageChannel } from './manage-channel';
import { ManageVideo } from './manage-video';

export const DashboardManageChannel = () => {
  return (
    <div className="flex-1 h-full p-4 overflow-auto">
      <div className="">
        <div className=" min-h-[500px]">
          <Routes>
            <Route path="" element={<ManageChannel />} />
            <Route
              path="detail-channel/:channelName"
              element={<ManageVideo />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};
