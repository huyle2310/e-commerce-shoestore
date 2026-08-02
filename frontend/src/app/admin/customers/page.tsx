'use client';

import { useState, useEffect } from 'react';
import { Search, ShieldAlert, ShieldCheck, UserCog, UserCheck, UserX, UserPlus, Mail, Phone, MapPin } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/admin');
      setUsers(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!window.confirm(`Bạn có chắc muốn đổi quyền của người dùng này thành ${newRole}?`)) return;
    
    setUpdating(userId);
    try {
      await api.put(`/users/admin/${userId}/role?role=${newRole}`);
      toast.success("Cập nhật quyền thành công!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật quyền");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Vô hiệu hoá' : 'Kích hoạt';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;
    
    setUpdating(userId);
    try {
      await api.put(`/users/admin/${userId}/status?isActive=${!currentStatus}`);
      toast.success(`${action} tài khoản thành công!`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Lỗi khi ${action}`);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center w-fit"><ShieldAlert size={14} className="mr-1" /> Quản trị viên</span>;
      case 'INVENTORY_STAFF': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center w-fit"><ShieldCheck size={14} className="mr-1" /> NV Kho</span>;
      case 'SALES_STAFF': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center w-fit"><UserCog size={14} className="mr-1" /> NV Bán hàng</span>;
      case 'CUSTOMER': return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold flex items-center w-fit"><UserCheck size={14} className="mr-1" /> Khách hàng</span>;
      default: return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold w-fit">{role}</span>;
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.phone && u.phone.includes(searchTerm));
    return matchesSearch && u.role === 'CUSTOMER';
  });

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Khách hàng</h2>
          <p className="text-neutral-500">Xem danh sách khách hàng và lịch sử hoạt động</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo Tên, Email, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-sm">
              <th className="p-4 font-medium rounded-tl-xl">Khách hàng</th>
              <th className="p-4 font-medium">Liên hệ</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium">Hạng</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">Không tìm thấy khách hàng</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className={`border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors ${!user.isActive ? 'opacity-60 bg-neutral-50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{user.fullName}</p>
                        <p className="text-xs text-neutral-500">Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <p className="text-sm flex items-center text-neutral-600"><Mail size={14} className="mr-2 text-neutral-400" /> {user.email}</p>
                      <p className="text-sm flex items-center text-neutral-600"><Phone size={14} className="mr-2 text-neutral-400" /> {user.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.isActive ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Đang hoạt động</span>
                    ) : (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">Đã khoá</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
                      {user.rankName || 'MEMBER'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        disabled={updating === user.id}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          user.isActive 
                            ? 'border-red-200 text-red-600 hover:bg-red-50' 
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                      </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
