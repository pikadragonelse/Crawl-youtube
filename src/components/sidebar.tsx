import React, { useEffect } from 'react';
import logo from '../../assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { YoutubeOutlined, AppstoreOutlined } from '@ant-design/icons';
import clsx from 'clsx';

type SidebarItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
};

const listSidebarItem: SidebarItem[] = [
  {
    title: 'Tải dữ liệu',
    icon: <YoutubeOutlined className="text-2xl" />,
    href: '/',
  },
  {
    title: 'Quản lý kênh',
    icon: <AppstoreOutlined className="text-2xl" />,
    href: '/manage-page',
  },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="h-full w-64 border-r">
      <div className="w-32 pt-24 pb-16 mx-auto">
        <img src={logo} alt="" className="w-full h-full" />
      </div>
      <ul className="">
        {listSidebarItem.map((item, index) => (
          <Link to={item.href} className="" key={index}>
            <li
              className={clsx(
                'flex items-center pl-10 py-2 mx-2 rounded-xl gap-2 mb-1  transition-all',
                {
                  'hover:bg-zinc-200': location.pathname !== item.href,
                  'bg-red-600 text-zinc-50 hover:bg-red-600':
                    location.pathname !== '/'
                      ? item.href === '/'
                        ? false
                        : location.pathname.includes(item.href)
                      : location.pathname === item.href,
                },
              )}
            >
              <div>{item.icon}</div>
              <span className="block mb-1">{item.title}</span>
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
};
