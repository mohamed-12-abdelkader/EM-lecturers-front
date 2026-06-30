import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Button, Input, VStack, HStack, Text, Select, useToast, FormControl, FormLabel, Checkbox, CheckboxGroup
} from '@chakra-ui/react';
import { useState } from 'react';

const defaultGrades = [
    { id: 1, name: 'أولى إعدادي' },
    { id: 2, name: 'ثانية إعدادي' },
    { id: 3, name: 'ثالثة إعدادي' },
    { id: 4, name: 'أولى ثانوي' },
    { id: 5, name: 'ثانية ثانوي' },
    { id: 6, name: 'ثالثة ثانوي' }
];

const AddGroupModal = ({ isOpen, onClose, onAdd, loading = false, grades: gradesProp }) => {
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const [gradeId, setGradeId] = useState('');
    const toast = useToast();
    const grades = Array.isArray(gradesProp) && gradesProp.length > 0 ? gradesProp : defaultGrades;

    const days = [
        { value: 'السبت', label: 'السبت' },
        { value: 'الأحد', label: 'الأحد' },
        { value: 'الاثنين', label: 'الاثنين' },
        { value: 'الثلاثاء', label: 'الثلاثاء' },
        { value: 'الأربعاء', label: 'الأربعاء' },
        { value: 'الخميس', label: 'الخميس' },
        { value: 'الجمعة', label: 'الجمعة' }
    ];

    const handleAdd = () => {
        if (name.trim() === '') {
            toast({ title: 'من فضلك أدخل اسم المجموعة', status: 'warning' });
            return;
        }
        if (!startTime) {
            toast({ title: 'من فضلك أدخل وقت البداية', status: 'warning' });
            return;
        }
        if (!endTime) {
            toast({ title: 'من فضلك أدخل وقت النهاية', status: 'warning' });
            return;
        }
        if (selectedDays.length === 0) {
            toast({ title: 'من فضلك اختر أيام المجموعة', status: 'warning' });
            return;
        }
        if (!gradeId) {
            toast({ title: 'من فضلك اختر الصف الدراسي', status: 'warning' });
            return;
        }

        // التحقق من أن وقت النهاية بعد وقت البداية
        if (startTime >= endTime) {
            toast({ title: 'وقت النهاية يجب أن يكون بعد وقت البداية', status: 'warning' });
            return;
        }

        const groupData = {
            name: name.trim(),
            start_time: startTime,
            end_time: endTime,
            days: selectedDays.join(','),
            grade_id: parseInt(gradeId)
        };
        
        console.log('Sending group data:', groupData); // للتأكد من البيانات
        onAdd(groupData);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setStartTime('');
        setEndTime('');
        setSelectedDays([]);
        setGradeId('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleDayChange = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>إنشاء مجموعة دراسية جديدة</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>اسم المجموعة</FormLabel>
                            <Input
                                placeholder="مثال: مجموعة الرياضيات المتقدمة"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                size="lg"
                            />
                        </FormControl>

                        <HStack width="100%" spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>وقت البداية</FormLabel>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    size="lg"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>وقت النهاية</FormLabel>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    size="lg"
                                />
                            </FormControl>
                        </HStack>

                        <FormControl isRequired>
                            <FormLabel>أيام المجموعة</FormLabel>
                            <VStack align="start" spacing={2} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                                {days.map((day) => (
                                    <Checkbox
                                        key={day.value}
                                        isChecked={selectedDays.includes(day.value)}
                                        onChange={() => handleDayChange(day.value)}
                                        colorScheme="teal"
                                    >
                                        {day.label}
                                    </Checkbox>
                                ))}
                            </VStack>
                            {selectedDays.length > 0 && (
                                <Text fontSize="sm" color="teal.600" mt={2}>
                                    الأيام المختارة: {selectedDays.join('، ')}
                                </Text>
                            )}
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>الصف الدراسي</FormLabel>
                            <Select 
                                placeholder="اختر الصف الدراسي" 
                                value={gradeId} 
                                onChange={(e) => setGradeId(e.target.value)}
                                size="lg"
                            >
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={handleClose}>
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleAdd}
                        colorScheme="teal"
                        isLoading={loading}
                        loadingText="جاري الإنشاء..."
                    >
                        إنشاء المجموعة
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddGroupModal;
  