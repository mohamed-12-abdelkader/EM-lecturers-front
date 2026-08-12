import AcademyLayout from "./AcademyLayout";
import { ACADEMY_NAV, ACADEMY_TEACHER_NAV } from "../academyUtils";

export function AcademyOwnerShell() {
  return (
    <AcademyLayout
      navItems={ACADEMY_NAV}
      title="إدارة الأكاديمية"
      subtitle="مدرسون · كورسات · إسنادات"
      basePath="/academy"
    />
  );
}

export function AcademyTeacherShell() {
  return (
    <AcademyLayout
      navItems={ACADEMY_TEACHER_NAV}
      title="مدرس الأكاديمية"
      subtitle="الكورسات المسندة إليك"
      basePath="/academy/me"
    />
  );
}
