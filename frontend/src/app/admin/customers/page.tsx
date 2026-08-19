'use client';

import { useState, useEffect } from 'react';
import { Search, ShieldAlert, ShieldCheck, UserCog, UserCheck, UserX, UserPlus, Mail, Phone, Edit, Lock, Unlock } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [updating, setUpdating] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

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

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.email || !editingUser.fullName) {
      toast.error("Vui lòng điền đủ Họ tên và Email!");
      return;
    }

    setUpdating(editingUser.id);
    try {
      await api.put(`/users/admin/${editingUser.id}`, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: 'CUSTOMER',
        isActive: editingUser.isActive
      });
      toast.success("Cập nhật thông tin thành công!");
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
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
    switch (role) {
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
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-sm">
              <th className="p-4 font-medium rounded-tl-xl">Khách hàng</th>
              <th className="p-4 font-medium">Liên hệ</th>
              <th className="px-12 font-medium">Trạng thái</th>
              <th className="px-12 font-medium">Hạng</th>
              <th className="p-15 font-medium">Thống kê</th>
              <th className="p-12 font-medium text-center rounded-tr-xl">Thao tác</th>
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
                  < td className="p-4" >
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
                  <td className="p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Đơn hàng: <span className="font-bold text-orange-600">{user.totalOrders || 0}</span></p>
                      <p className="text-sm font-medium">Đã chi: <span className="font-bold text-green-600">{user.totalSpent ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalSpent) : '0 ₫'}</span></p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setEditingUser({ ...user }); setIsEditModalOpen(true); }}
                        disabled={updating === user.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        disabled={updating === user.id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {user.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div >

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h3 className="text-xl font-bold text-neutral-900">Sửa thông tin Khách hàng</h3>
              <button
                onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <UserX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                  />
                  Tài khoản đang hoạt động
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                  className="flex-1 px-6 py-3 border border-neutral-200 text-neutral-700 font-bold rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating === editingUser.id}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === editingUser.id ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div >
  );
}
