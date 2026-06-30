import React, { useState, useEffect } from "react";
import { Button, Input, VStack, HStack, Box, Text, useToast } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import useCreateComp from "../../Hooks/comp/useCreateComp";
import baseUrl from "../../api/baseUrl";

const CreateComp = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    duration: "",
    grade_id: "",
    is_visible: true,
    is_active: true
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [grades, setGrades] = useState([]);
  const toast = useToast();

  // جلب الصفوف الدراسية
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await baseUrl.get("/api/users/grades");
        setGrades(response.data.grades || []);
      } catch (error) {
        console.error("Error fetching grades:", error);
        toast({
          title: "خطأ",
          description: "فشل في جلب الصفوف الدراسية",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchGrades();
  }, [toast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    if (!formData.title || !formData.duration || !formData.grade_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // الحصول على التوكين من localStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('grade_id', formData.grade_id);
      formDataToSend.append('is_visible', formData.is_visible);
      formDataToSend.append('is_active', formData.is_active);

      // إرسال البيانات إلى API مع التوكين في headers
      const response = await baseUrl.post('api/competitions', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // لا نضع Content-Type لأننا نرسل FormData
        },
      });

      const result = response.data;
      console.log('API Response:', result);
      
      toast({
        title: "تم الإرسال",
        description: "تم إنشاء المسابقة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // إعادة تعيين الفورم
      setFormData({
        title: "",
        description: "",
        image: null,
        duration: "",
        grade_id: "",
        is_visible: true,
        is_active: true
      });
      setImagePreview(null);
      
    } catch (error) {
      console.error('Error creating competition:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المسابقة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box className='w-[90%] m-auto mt-[50px] p-6 bg-white rounded-lg shadow-lg'>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={6} color="blue.600">
        إنشاء مسابقة جديدة
      </Text>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          
          {/* رفع صورة المسابقة */}
          <Box>
            <Text fontWeight="bold" mb={3}>
              صورة المسابقة <span style={{ color: "red" }}>*</span>
            </Text>
            <Box
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="lg"
              p={4}
              textAlign="center"
              cursor="pointer"
              _hover={{ borderColor: "blue.400" }}
              onClick={() => document.getElementById('upload-image').click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="معاينة الصورة"
                  style={{ height: "200px", width: "200px", objectFit: "cover", margin: "0 auto" }}
                />
              ) : (
                <VStack>
                  <Text color="gray.500">اضغط لاختيار صورة المسابقة</Text>
                  <Text fontSize="sm" color="gray.400">أو اسحب الصورة هنا</Text>
                </VStack>
              )}
            </Box>
            <input
              type='file'
              id='upload-image'
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </Box>

          {/* عنوان المسابقة */}
          <Box>
            <Text fontWeight="bold" mb={2}>
              عنوان المسابقة <span style={{ color: "red" }}>*</span>
            </Text>
            <Input
              placeholder='أدخل عنوان المسابقة'
              size='lg'
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </Box>

          {/* وصف المسابقة */}
          <Box>
            <Text fontWeight="bold" mb={2}>
              وصف المسابقة
            </Text>
            <Input
              placeholder='أدخل وصف المسابقة'
              size='lg'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Box>

          {/* اختيار الصف */}
          <Box>
            <Text fontWeight="bold" mb={2}>
              الصف الدراسي <span style={{ color: "red" }}>*</span>
            </Text>
            <Select
              placeholder='اختر الصف'
              size='lg'
              value={formData.grade_id}
              onChange={(e) => handleInputChange('grade_id', e.target.value)}
              required
            >
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </Select>
          </Box>

          {/* مدة المسابقة */}
          <Box>
            <Text fontWeight="bold" mb={2}>
              مدة المسابقة (بالدقائق) <span style={{ color: "red" }}>*</span>
            </Text>
            <Input
              type="number"
              placeholder='أدخل مدة المسابقة بالدقائق'
              size='lg'
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              min="1"
              required
            />
          </Box>

          {/* خيارات إضافية */}
          <HStack spacing={6}>
            <Box flex={1}>
              <Text fontWeight="bold" mb={2}>
                حالة الرؤية
              </Text>
              <Select
                size='lg'
                value={formData.is_visible.toString()}
                onChange={(e) => handleInputChange('is_visible', e.target.value === 'true')}
              >
                <option value='true'>مرئية</option>
                <option value='false'>مخفية</option>
              </Select>
            </Box>
            
            <Box flex={1}>
              <Text fontWeight="bold" mb={2}>
                حالة النشاط
              </Text>
              <Select
                size='lg'
                value={formData.is_active.toString()}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
              >
                <option value='true'>نشطة</option>
                <option value='false'>غير نشطة</option>
              </Select>
            </Box>
          </HStack>

          {/* زر الإرسال */}
          <Box textAlign="center" pt={4}>
            <Button
              colorScheme='blue'
              size='lg'
              type='submit'
              px={8}
              py={3}
              fontSize="lg"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              إنشاء المسابقة
            </Button>
          </Box>
        </VStack>
      </form>
    </Box>
  );
};

export default CreateComp;
