import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { safeLocalGet } from "../../utils/safeStorage";
import { resolveAuthRoles } from "../../utils/authRoles";

function readStoredUser() {
  try {
    const raw = safeLocalGet("user");
    if (raw == null || raw === "") return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const UserType = () => {
  const location = useLocation();
  const initialUser = readStoredUser();
  const initialRoles = resolveAuthRoles(initialUser);

  const [userData, setUserData] = useState(initialUser);
  const [isAdmin, setIsAdmin] = useState(initialRoles.isAdmin);
  const [isTeacher, setIsTeacher] = useState(initialRoles.isTeacher);
  const [student, setStudent] = useState(initialRoles.student);
  const [isAcademy, setIsAcademy] = useState(initialRoles.isAcademy);
  const [isAcademyTeacher, setIsAcademyTeacher] = useState(initialRoles.isAcademyTeacher);

  const syncFromStorage = useCallback(() => {
    const user = readStoredUser();
    setUserData(user);
    const r = resolveAuthRoles(user);
    setIsAdmin(r.isAdmin);
    setIsTeacher(r.isTeacher);
    setStudent(r.student);
    setIsAcademy(r.isAcademy);
    setIsAcademyTeacher(r.isAcademyTeacher);
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [location.pathname, syncFromStorage]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user" || e.key === null) syncFromStorage();
    };
    const onAuthUpdate = () => syncFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-storage-update", onAuthUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-storage-update", onAuthUpdate);
    };
  }, [syncFromStorage]);

  return [userData, isAdmin, isTeacher, student, isAcademy, isAcademyTeacher];
};

export default UserType;
