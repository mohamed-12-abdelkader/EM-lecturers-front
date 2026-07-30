import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { safeLocalGet } from "../../utils/safeStorage";

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

function rolesFromUser(user) {
  if (user == null || typeof user !== "object") {
    return { isAdmin: false, isTeacher: false, student: false };
  }
  if (user.role === "teacher") {
    return { isAdmin: false, isTeacher: true, student: false };
  }
  if (user.role === "admin") {
    return { isAdmin: true, isTeacher: false, student: false };
  }
  return { isAdmin: false, isTeacher: false, student: true };
}

const UserType = () => {
  const location = useLocation();
  const initialUser = readStoredUser();
  const initialRoles = rolesFromUser(initialUser);

  const [userData, setUserData] = useState(initialUser);
  const [isAdmin, setIsAdmin] = useState(initialRoles.isAdmin);
  const [isTeacher, setIsTeacher] = useState(initialRoles.isTeacher);
  const [student, setStudent] = useState(initialRoles.student);

  const syncFromStorage = useCallback(() => {
    const user = readStoredUser();
    setUserData(user);
    const r = rolesFromUser(user);
    setIsAdmin(r.isAdmin);
    setIsTeacher(r.isTeacher);
    setStudent(r.student);
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

  return [userData, isAdmin, isTeacher, student];
};

export default UserType;
