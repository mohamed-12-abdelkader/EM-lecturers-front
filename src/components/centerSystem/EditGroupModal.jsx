import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Input, VStack, HStack, Text, 
  Checkbox, CheckboxGroup, useToast
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

const EditGroupModal = ({ isOpen, onClose, onUpdate, group, loading = false }) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const toast = useToast();

  const daysOfWeek = [
    { value: 'الأحد', label: 'الأحد' },
    { value: 'الاثنين', label: 'الاثنين' },
    { value: 'الثلاثاء', label: 'الثلاثاء' },
    { value: 'الأربعاء', label: 'الأربعاء' },
    { value: 'الخميس', label: 'الخميس' },
    { value: 'الجمعة', label: 'الجمعة' },
    { value: 'السبت', label: 'السبت' }
  ];

  // تحميل بيانات المجموعة عند فتح المودال
  useEffect(() => {
    if (group && isOpen) {
      setName(group.name || '');
      setStartTime(group.start_time ? group.start_time.substring(0, 5) : '');
      setEndTime(group.end_time ? group.end_time.substring(0, 5) : '');
      setSelectedDays(group.days ? group.days.split(',') : []);
    }
  }, [group, isOpen]);

  const handleUpdate = () => {
    if (name.trim() === '') {
      return toast({ title: 'من فضلك أدخل اسم المجموعة', status: 'warning' });
    }
    if (!startTime) {
      return toast({ title: 'من فضلك اختر وقت البداية', status: 'warning' });
    }
    if (!endTime) {
      return toast({ title: 'من فضلك اختر وقت النهاية', status: 'warning' });
    }
    if (selectedDays.length === 0) {
      return toast({ title: 'من فضلك اختر أيام الدراسة', status: 'warning' });
    }
    if (startTime >= endTime) {
      return toast({ title: 'وقت النهاية يجب أن يكون بعد وقت البداية', status: 'warning' });
    }

    const groupData = {
      name: name.trim(),
      start_time: startTime,
      end_time: endTime,
      days: selectedDays.join(',')
    };

    onUpdate(group.id, groupData);
  };

  const handleClose = () => {
    setName('');
    setStartTime('');
    setEndTime('');
    setSelectedDays([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>تعديل المجموعة</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Input 
              placeholder="اسم المجموعة" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              size="lg"
            />
            
            <HStack spacing={4} width="100%">
              <VStack align="start" flex={1}>
                <Text fontSize="sm" fontWeight="medium">وقت البداية</Text>
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  size="md"
                />
              </VStack>
              
              <VStack align="start" flex={1}>
                <Text fontSize="sm" fontWeight="medium">وقت النهاية</Text>
                <Input 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  size="md"
                />
              </VStack>
            </HStack>

            <VStack align="start" width="100%">
              <Text fontSize="sm" fontWeight="medium">أيام الدراسة</Text>
              <CheckboxGroup value={selectedDays} onChange={setSelectedDays}>
                <HStack wrap="wrap" spacing={3}>
                  {daysOfWeek.map((day) => (
                    <Checkbox key={day.value} value={day.value} colorScheme="teal">
                      {day.label}
                    </Checkbox>
                  ))}
                </HStack>
              </CheckboxGroup>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleUpdate} 
            colorScheme="blue" 
            isLoading={loading}
            loadingText="جاري التحديث..."
          >
            تحديث المجموعة
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditGroupModal; 