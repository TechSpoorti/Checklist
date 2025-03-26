import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, FlatList, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { DataTable } from 'react-native-paper';
import { ScrollView } from 'react-native';
import { Image } from 'react-native';



type AfterMaintenanceItem = {
  [x: string]: any;
  checklist_id: number;
  part_id: number;
  param: string;
  ptype: string;
  stdVal: string;
  unit: string;
  measured_value: string;
  after_maintenance_value: string;
  remark: string;
  captured_image_after_inspection: string | null;
  remark_by_approver: string;
};

type ApproverPageProps = NativeStackScreenProps<RootStackParamList, 'ApproverPage'>;

const ApproverPage: React.FC<ApproverPageProps> = ({ route, navigation }) => {
  const { part_id } = route.params;
  const [checklistData, setChecklistData] = useState<AfterMaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AfterMaintenanceItem | null>(null);
  const [inputType, setInputType] = useState<'measured_value' | 'remark' | 'after_maintenance_value' | 'remark_by_approver' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');

  useEffect(() => {
    fetch(`http://192.168.68.56:5000/api/checklist?part_id=${part_id}`)
      .then((response) => response.json())
      .then((data) => {
        setChecklistData(
          data.map((item: any) => ({
            checklist_id: item.checklist_id,
            part_id: item.part_id,
            param: item.parameter_name.substring(0, 6) + '...',
            ptype: item.parameter_value_type,
            stdVal: item.standard_value,
            unit: item.unit,
            measured_value: item.measured_value,
            after_maintenance_value: item.after_maintenance_value,
            remark: item.remark,
            captured_image_after_inspection: item.captured_image_after_inspection,
            remark_by_approver: '',
          }))
        );
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching checklist data:', error);
        setLoading(false);
      });
  }, [part_id]);

  const handleInputModal = (item: AfterMaintenanceItem, type: 'measured_value' | 'remark' | 'after_maintenance_value' | 'remark_by_approver') => {
    setSelectedItem(item);
    setInputType(type);
    setInputValue(item[type]);
    setModalVisible(true);
  };

  const handleSaveInput = () => {
    if (selectedItem && inputType) {
      const updatedData = checklistData.map((item) =>
        item.checklist_id === selectedItem.checklist_id ? { ...item, [inputType]: inputValue } : item
      );
      setChecklistData(updatedData);
    }
    setModalVisible(false);
  };

  const handleDeleteInput = (item: AfterMaintenanceItem, type: 'measured_value' | 'remark' | 'after_maintenance_value' | 'remark_by_approver') => {
    const updatedData = checklistData.map((entry) =>
      entry.checklist_id === item.checklist_id ? { ...entry, [type]: null } : entry
    );
    setChecklistData(updatedData);
  };

  const handleRejectClick = () => {
    setModalVisible(true);
    setApprovalStatus('Rejected');
  };

  const handleApproveClick = () => {
    setApprovalStatus('Approved');
    handleApproveReject('Approved', '');
  };

  const handleSaveRejectionRemarks = () => {
    if (!rejectionRemarks) {
      Alert.alert('Error', 'Please provide rejection remarks.');
      return;
    }
    handleApproveReject('Rejected', rejectionRemarks);
    setModalVisible(false);
  };

  const handleApproveReject = async (approvalStatus: string, rejectionRemarks: string) => {
    try {
      const incompleteFields = checklistData.filter(
        (item) => !item.remark_by_approver || !item.checklist_id || !item.part_id
      );

      if (incompleteFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all required fields before submitting.');
        return;
      }

      const updatePromises = checklistData.map((item) => {
        if (item.remark_by_approver || item.checklist_id || item.part_id) {
          return fetch('http://192.168.68.56:5000/api/updateApprover', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              checklist_id: item.checklist_id,
              part_id: item.part_id,
              measured_value: item.measured_value,
              after_maintenance_value: item.after_maintenance_value,
              remark: item.remark,
              captured_image_after_inspection: item.captured_image_after_inspection,
              remark_by_approver: item.remark_by_approver,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                return response.text().then((text) => {
                  throw new Error(`Server Error: ${response.status} - ${text}`);
                });
              }
              return response.json();
            })
            .then((data) => {
              console.log('Checklist updated successfully:', data);
            })
            .catch((error) => {
              console.error('Error updating checklist item:', error);
            });
        }
        return null;
      });

      await Promise.all(updatePromises.filter((p) => p !== null));

      const partId = String(part_id);
      const updatedStage = 'Approver1 Stage Completed';

      const response = await fetch('http://192.168.68.56:5000/api/updatePartStage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          part_id: partId,
          stage: updatedStage,
          approval_status: approvalStatus,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error updating part stage and approval status: ${response.status} - ${text}`);
      }

      const data = await response.json();
      console.log('Part stage and approval status updated successfully:', data);

      Alert.alert('Success', `Approval Status: ${approvalStatus}`);
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Failed to update the checklist and approval status.');
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  function handleImagePick(index: number): void {
    throw new Error('Function not implemented.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inspection for Part ID: {part_id}</Text>
  
      <DataTable style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5 }}>
        {/* Table Header */}
        <DataTable.Header style={{ backgroundColor: "#007BFF", borderBottomWidth: 1, borderColor: "#ccc" }}>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Param</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Std. Val</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Unit</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Measured</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>After Maintenance</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Remark</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Image</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Remark by Approver</Text></DataTable.Title>
        </DataTable.Header>
  
        {/* Table Rows */}
        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          {checklistData.map((item, index) => (
            <DataTable.Row key={item.checklist_id || index} style={{ borderBottomWidth: 1, borderColor: "#ccc" }}>
              <DataTable.Cell>{item.param}</DataTable.Cell>
              <DataTable.Cell>{item.stdVal}</DataTable.Cell>
              <DataTable.Cell>{item.unit}</DataTable.Cell>
              <DataTable.Cell>{item.measured_value}</DataTable.Cell>
              <DataTable.Cell>{item.after_maintenance_value}</DataTable.Cell>
              <DataTable.Cell>{item.remark}</DataTable.Cell>
  
              {/* Image Capture */}
              <DataTable.Cell>
                    <View style={styles.imageCell}>
                      {item.captured_image_after_inspection ? (
                        <Image source={{ uri: `http://192.168.1.101:8080${item.captured_image_after_inspection}` }} style={styles.imagePreview} />
                      ) : null}
                    </View>
                  </DataTable.Cell>
  
              {/* Remark by Approver */}
              <DataTable.Cell>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  {item.remark_by_approver ? (
                    <>
                      <Text style={styles.valueText}>{item.remark_by_approver}</Text>
                      <View style={{ flexDirection: "column", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => handleInputModal(item, 'remark_by_approver')}>
                          <Text style={styles.iconText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteInput(item, 'remark_by_approver')}>
                          <Text style={styles.iconText}>➖</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => handleInputModal(item, 'remark_by_approver')}>
                      <Text style={styles.iconText}>➕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </ScrollView>
      </DataTable>
  
      {/* Approve & Reject Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.approveButton} onPress={handleApproveClick}>
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={handleRejectClick}>
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
  
      {/* Modal for Input */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder={inputType === 'remark_by_approver' ? 'Enter Remark_by_approver' : ''}
              value={inputValue}
              onChangeText={setInputValue}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveInput}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
  
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f4f8' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  imageCell: { flex: 1, alignItems: "center", flexWrap: "wrap" },
  imagePreview: { width: 50, height: 50, borderRadius: 5 },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  cell: {
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
  valueCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 250,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
    marginTop: 5,
  },

  valueText: {
    fontSize: 12,
    textAlign: 'center',
    marginRight: 5,
    color: '#333',
  },
});

export default ApproverPage;
