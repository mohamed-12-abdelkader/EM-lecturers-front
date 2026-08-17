import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AUTH_STORAGE_UPDATE_EVENT, readStoredUser } from "../../utils/authStorage";
import { normalizeAuthUser, resolveAuthRoles } from "../../utils/authRoles";

function readStoredUserFromHook() {
  return readStoredUser();
}

const UserType = () => {
  const location = useLocation();
  const { user: authUser } = useAuth();
  const initialUser = normalizeAuthUser(readStoredUserFromHook() ?? authUser, {
    fallbackUser: readStoredUserFromHook() ?? authUser,
  });
  const initialRoles = resolveAuthRoles(initialUser);

  const [userData, setUserData] = useState(initialUser);
  const [isAdmin, setIsAdmin] = useState(initialRoles.isAdmin);
  const [isTeacher, setIsTeacher] = useState(initialRoles.isTeacher);
  const [student, setStudent] = useState(initialRoles.student);
  const [isAcademy, setIsAcademy] = useState(initialRoles.isAcademy);
  const [isAcademyTeacher, setIsAcademyTeacher] = useState(initialRoles.isAcademyTeacher);

  const syncFromStorage = useCallback(() => {
    const stored = readStoredUserFromHook();
    const user = normalizeAuthUser(authUser ?? stored, {
      fallbackUser: stored ?? authUser,
    });
    setUserData(user);
    const r = resolveAuthRoles(user);
    setIsAdmin(r.isAdmin);
    setIsTeacher(r.isTeacher);
    setStudent(r.student);
    setIsAcademy(r.isAcademy);
    setIsAcademyTeacher(r.isAcademyTeacher);
  }, [authUser]);

  useEffect(() => {
    syncFromStorage();
  }, [location.pathname, authUser, syncFromStorage]);

  useEffect(() => {
    const onStorage = (e) => {
      if (
        e.key === "user" ||
        e.key === null ||
        (typeof e.key === "string" && e.key.startsWith("em-auth:"))
      ) {
        syncFromStorage();
      }
    };
    const onAuthUpdate = () => syncFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_STORAGE_UPDATE_EVENT, onAuthUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_STORAGE_UPDATE_EVENT, onAuthUpdate);
    };
  }, [syncFromStorage]);

  return [userData, isAdmin, isTeacher, student, isAcademy, isAcademyTeacher];
};

export default UserType;
