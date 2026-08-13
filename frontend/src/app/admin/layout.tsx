'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Package, Warehouse, FileText, Image, ChevronDown, ChevronRight, Globe, UserCog, Tag, Award, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    content: pathname.includes('/admin/settings/site') || pathname.includes('/admin/blogs')
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted) {
    return <div className="min-h-screen bg-[#121111] font-bold flex items-center justify-center text-white">Đang tải...</div>;
  }

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { name: 'Tổng quan', path: '/admin', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'SALES_STAFF'] },
    {
      name: 'Quản lý Sản phẩm',
      key: 'products',
      icon: <Package size={20} />,
      roles: ['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF'],
      subItems: [
        { name: 'Sản phẩm', path: '/admin/products' },
        { name: 'Danh mục', path: '/admin/categories' },
        { name: 'Thương hiệu', path: '/admin/brands' },
      ]
    },
    {
      name: 'Kho Hàng',
      key: 'inventory',
      icon: <Warehouse size={20} />,
      roles: ['ADMIN', 'INVENTORY_STAFF'],
      subItems: [
        { name: 'Tồn kho', path: '/admin/inventory/stocks' },
        { name: 'Nhập hàng', path: '/admin/inventory/imports' },
        { name: 'Kiểm kê', path: '/admin/inventory/audits' },
        { name: 'Kho nhập', path: '/admin/warehouse/inventory' },
        { name: 'Kho thanh lý', path: '/admin/warehouse/clearance' },
      ]
    },
    { name: 'Mã giảm giá', path: '/admin/vouchers', icon: <Ticket size={20} />, roles: ['ADMIN', 'SALES_STAFF'] },
    { name: 'Đơn hàng', path: '/admin/orders', icon: <ShoppingBag size={20} />, roles: ['ADMIN', 'SALES_STAFF'] },
    { name: 'Khách hàng', path: '/admin/customers', icon: <Users size={20} />, roles: ['ADMIN', 'SALES_STAFF'] },
    { name: 'Nhân viên', path: '/admin/users', icon: <UserCog size={20} />, roles: ['ADMIN'] },
    {
      name: 'Quản lý nội dung',
      key: 'content',
      icon: <Globe size={20} />,
      roles: ['ADMIN'],
      subItems: [
        { name: 'Quản lý Bài viết', path: '/admin/blogs' },
        { name: 'Cài đặt trang web', path: '/admin/settings/site' },
      ]
    },

  ];

  if (!isAuthenticated || !['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF'].includes(user?.role || '')) return null;

  const roleName = user?.role === 'ADMIN' ? 'Quản trị viên' :
    user?.role === 'INVENTORY_STAFF' ? 'Nhân viên Kho' :
      user?.role === 'SALES_STAFF' ? 'Nhân viên Bán hàng' : 'Nhân viên';

  return (
    <div className="flex h-screen bg-neutral-100 font-sans">
      {/* Sidebar */}
      <aside className="w-70 bg-neutral-950 text-white flex flex-col overflow-y-auto">
        <div className="h-20 flex-shrink-0 flex items-center px-6 border-b border-neutral-800">
          <Link href="/admin" className="text-2xl font-bold tracking-tighter text-white">
            VANGUARD<span className="text-orange-500">.</span> Admin
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.filter(item => item.roles.includes(user?.role || '')).map((item) => {
            if (item.subItems) {
              const isOpen = openMenus[item.key!];
              const isChildActive = item.subItems.some(sub => pathname.includes(sub.path.split('?')[0]));

              return (
                <div key={item.key} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.key!)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isChildActive ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isOpen && (
                    <div className="pl-11 pr-2 py-2 space-y-1">
                      {item.subItems.map((sub) => {
                        const subPathBase = sub.path.split('?')[0];
                        const isSubActive = pathname === subPathBase; // Simplified active check for now
                        return (
                          <Link
                            key={sub.path}
                            href={sub.path}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isSubActive ? 'bg-orange-500 text-white font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                              }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${pathname === item.path ? 'bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/20' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={async () => {
              try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch (e) { }
              logout();
              router.push('/login');
            }}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-neutral-800">
            {navItems.find(item => item.path === pathname)?.name || 'Quản trị'}
          </h2>
          <div className="flex items-center space-x-4">
            <Link href="/" target="_blank" className="text-sm font-medium text-orange-500 hover:text-orange-600 px-4 py-2 bg-orange-50 rounded-full">
              Xem trang web
            </Link>
            <div className="flex items-center space-x-3 pl-4 border-l border-neutral-200">
              <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">{user?.fullName}</p>
                <p className="text-xs text-neutral-500">{roleName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
