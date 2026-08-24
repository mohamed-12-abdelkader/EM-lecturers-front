import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { FaEdit, FaEye, FaFilePdf, FaPlus, FaTrash } from "react-icons/fa";
import {
  buildCourseFileViewPath,
  courseFilesApiError,
  formatCourseFileSize,
  getCourseFileDisplayName,
} from "../../../api/courseFilesApi";
import { useLectureFileMutations, useLectureFiles } from "../../../Hooks/course/useCourseFiles";
import { crBtnSecondary, lcBodySm, lcLabel } from "../courseTheme";
import DeleteCourseFileModal from "./DeleteCourseFileModal";
import EditCourseFileModal from "./EditCourseFileModal";
import UploadCourseFileModal from "./UploadCourseFileModal";

function normalizeLectureFile(file) {
  if (!file || typeof file !== "object") return null;
  return {
    id: file.id,
    courseId: file.courseId ?? file.course_id ?? null,
    lectureId: file.lectureId ?? file.lecture_id ?? null,
    title: file.title || file.filename || file.name || "",
    description: file.description || "",
    originalName: file.originalName ?? file.original_name ?? file.filename ?? "",
    fileSize: file.fileSize ?? file.file_size ?? 0,
    createdAt: file.createdAt ?? file.created_at ?? file.uploaded_at ?? null,
  };
}

function FileRow({ file, courseId, canManage, onEdit, onDelete }) {
  const navigate = useNavigate();
  const name = getCourseFileDisplayName(file);
  const sizeLabel = formatCourseFileSize(file.fileSize);
  const viewPath = buildCourseFileViewPath(courseId, file);

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-purple-300 sm:flex-row sm:items-center sm:gap-3 sm:px-3.5 sm:py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-700"
      dir="rtl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
          <FaFilePdf className="text-sm" />
        </div>
        <div className="min-w-0 text-right">
          <p className={`truncate ${lcBodySm} font-bold text-slate-800 dark:text-slate-100`}>{name}</p>
          {sizeLabel ? <p className={`mt-0.5 ${lcLabel}`}>{sizeLabel}</p> : null}
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {viewPath ? (
          <button
            type="button"
            className={`${crBtnSecondary} w-full !border-purple-200 !text-purple-600 hover:!bg-purple-50 sm:w-auto dark:!border-purple-800 dark:!text-purple-300`}
            onClick={() => navigate(viewPath)}
          >
            <FaEye />
            عرض PDF
          </button>
        ) : null}
        {canManage ? (
          <>
            <button
              type="button"
              aria-label={`تعديل ${name}`}
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-3 text-blue-600 hover:bg-blue-50 sm:h-auto sm:w-auto dark:border-slate-700 dark:hover:bg-blue-950/40"
              onClick={() => onEdit(file)}
            >
              <FaEdit className="text-xs" />
              <span className="ms-1.5 text-xs font-bold sm:hidden">تعديل</span>
            </button>
            <button
              type="button"
              aria-label={`حذف ${name}`}
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg px-3 text-red-500 hover:bg-red-50 sm:h-auto sm:w-auto dark:hover:bg-red-950/40"
              onClick={() => onDelete(file)}
            >
              <FaTrash className="text-xs" />
              <span className="ms-1.5 text-xs font-bold sm:hidden">حذف</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function LectureFilesSection({
  lectureId,
  courseId,
  canManage = false,
  initialFiles = [],
  onFilesChanged,
  isTourTarget = false,
}) {
  const toast = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const normalizedInitial = useMemo(
    () => initialFiles.map(normalizeLectureFile).filter(Boolean),
    [initialFiles],
  );

  const { data: files = normalizedInitial, refetch } = useLectureFiles(lectureId, {
    enabled: Boolean(lectureId),
    initialData: normalizedInitial.length ? normalizedInitial : undefined,
  });

  const { uploadMutation, updateMutation, deleteMutation } = useLectureFileMutations(
    lectureId,
    courseId,
  );

  const refresh = async () => {
    await refetch();
    onFilesChanged?.();
  };

  const handleUpload = async (payload) => {
    try {
      await uploadMutation.mutateAsync(payload);
      toast({
        title: "تم رفع الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setUploadOpen(false);
      await refresh();
    } catch (err) {
      toast({
        title: "تعذّر رفع الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = async (payload) => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ fileId: editTarget.id, ...payload });
      toast({
        title: "تم تحديث الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEditTarget(null);
      await refresh();
    } catch (err) {
      toast({
        title: "تعذّر تحديث الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({
        title: "تم حذف الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast({
        title: "تعذّر حذف الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filesCount = files.length;

  return (
    <section
      className="space-y-3"
      data-tour-id={isTourTarget ? "course-lecture-files" : undefined}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white sm:h-9 sm:w-9">
            <FaFilePdf className="text-xs sm:text-sm" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 sm:text-base dark:text-slate-100">ملفات PDF</h4>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-600 sm:px-2.5 dark:bg-purple-950/40 dark:text-purple-400">
            {filesCount}
          </span>
        </div>
        {canManage ? (
          <button
            type="button"
            className={`${crBtnSecondary} w-full !px-3.5 !py-2.5 !text-xs sm:w-auto sm:!py-2`}
            onClick={() => setUploadOpen(true)}
            data-tour-id={isTourTarget ? "course-lecture-add-file" : undefined}
          >
            <FaPlus />
            إضافة PDF
          </button>
        ) : null}
      </div>

      {filesCount === 0 ? (
        <p className={`rounded-2xl border border-dashed border-slate-300 px-3 py-6 text-center ${lcLabel} dark:border-slate-700`}>
          {canManage ? "لم تُضف ملفات PDF بعد — ارفع ملفاً للطلاب" : "لا توجد ملفات PDF في هذه المحاضرة بعد"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              courseId={courseId}
              canManage={canManage}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <UploadCourseFileModal
        isOpen={uploadOpen}
        onClose={() => !uploadMutation.isPending && setUploadOpen(false)}
        onSubmit={handleUpload}
        loading={uploadMutation.isPending}
      />

      <EditCourseFileModal
        isOpen={Boolean(editTarget)}
        onClose={() => !updateMutation.isPending && setEditTarget(null)}
        file={editTarget}
        onSubmit={handleEdit}
        loading={updateMutation.isPending}
      />

      <DeleteCourseFileModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        file={deleteTarget}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </section>
  );
}
