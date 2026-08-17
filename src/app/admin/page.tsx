import AdminDashboard from "@/components/admin-dashboard";

export const metadata = {
  title: "لوحة التحكم | عيادة د. ليان",
  description: "إدارة الحجوزات والخدمات والعروض والصور لعيادة د. ليان.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
