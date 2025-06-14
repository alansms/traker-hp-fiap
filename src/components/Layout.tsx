import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      <header>Header</header>
      <aside> /* sidebar */ </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
