import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, FlatList, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { ScrollView } from 'react-native';
import { DataTable } from "react-native-paper";
import { Image } from 'react-native';

// Removed imports for ImagePicker, RNHTMLtoPDF, DocumentPicker, and RNFS

type AfterMaintenanceItem = {
  checklist_id: number;
  part_id: number;
  param: string;
  ptype: string;
  stdVal: string;
  unit: string;
  measured_value: string;
  after_maintenance_value: string;
  remark: string;
  remark_by_approver: string;
  remark_by_approver2: string;
  remark_by_approver3: string;
  remark_by_approver4: string;
  captured_image_after_inspection: string | null;
};

type ApproverPageProps = NativeStackScreenProps<RootStackParamList, 'ApproverPage4'>;

const ApproverPage4: React.FC<ApproverPageProps> = ({ route, navigation }) => {
  const { part_id } = route.params;
  const [checklistData, setChecklistData] = useState<AfterMaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AfterMaintenanceItem | null>(null);
  const [inputType, setInputType] = useState<'measured_value' | 'remark' | 'after_maintenance_value' | 'remark_by_approver' | 'remark_by_approver2' | 'remark_by_approver3' | 'remark_by_approver4' | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    fetch(`http://192.168.68.56:5000/api/checklist?part_id=${part_id}`)
      .then(response => response.json())
      .then(data => {
        setChecklistData(data.map((item: any) => ({
          checklist_id: item.checklist_id,
          part_id: item.part_id,
          param: item.parameter_name.substring(0, 6) + "...",
          ptype: item.parameter_value_type,
          stdVal: item.standard_value,
          unit: item.unit,
          measured_value: item.measured_value,
          after_maintenance_value: item.after_maintenance_value,
          remark: item.remark,
          remark_by_approver: item.remark_by_approver,
          remark_by_approver2: item.remark_by_approver2,
          remark_by_approver3: item.remark_by_approver3,
          remark_by_approver4: '',
          captured_image_after_inspection: null,
        })));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching checklist data:', error);
        setLoading(false);
      });
  }, [part_id]);

  const handleInputModal = (item: AfterMaintenanceItem, type: 'measured_value' | 'remark' | 'after_maintenance_value' | 'remark_by_approver' | 'remark_by_approver2' | 'remark_by_approver3' | 'remark_by_approver4') => {
    setSelectedItem(item);
    setInputType(type);
    setInputValue(item[type]);
    setModalVisible(true);
  };

  const handleSaveInput = () => {
    if (selectedItem && inputType) {
      const updatedData = checklistData.map(item =>
        item.checklist_id === selectedItem.checklist_id ? { ...item, [inputType]: inputValue } : item
      );
      setChecklistData(updatedData);
    }
    setModalVisible(false);
  };

  const handleDeleteInput = (item: AfterMaintenanceItem, type: 'measured_value' | 'remark' | 'after_maintenance_value' | 'remark_by_approver' | 'remark_by_approver2' | 'remark_by_approver3' | 'remark_by_approver4') => {
    const updatedData = checklistData.map(entry =>
      entry.checklist_id === item.checklist_id ? { ...entry, [type]: null } : entry
    );
    setChecklistData(updatedData);
  };

  const handleApproveReject = async (approvalStatus: string) => {
    try {
      // Step 1: Check if any required fields are empty
      const incompleteFields = checklistData.filter(item =>
        !item.remark_by_approver || // Ensure remark_by_approver is filled
        !item.checklist_id ||       // Ensure checklist_id is filled
        !item.part_id               // Ensure part_id is filled
      );

      if (incompleteFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all required fields before submitting.');
        return; // Exit early if any fields are missing
      }

      // Step 2: Update checklist data on the server
      const updatePromises = checklistData.map(item => {
        // Only submit the data if the necessary fields are filled
        if (item.remark_by_approver || item.checklist_id || item.part_id) {
          return fetch('http://192.168.68.56:5000/api/updateApprover4', {
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
              remark_by_approver2: item.remark_by_approver2,
              remark_by_approver3: item.remark_by_approver3,
              remark_by_approver4: item.remark_by_approver4
            }),
          })
            .then(response => {
              if (!response.ok) {
                return response.text().then(text => {
                  throw new Error(`Server Error: ${response.status} - ${text}`);
                });
              }
              return response.json();
            })
            .then(data => {
              console.log('Checklist updated successfully:', data);
            })
            .catch(error => {
              console.error('Error updating checklist item:', error);
            });
        }
        return null; // Ensures array length consistency even if no update occurs
      });

      // Wait for all update requests to complete
      await Promise.all(updatePromises.filter(p => p !== null));

      // Step 3: Update the part stage and approval status in the part table
      const partId = String(part_id); // Ensure `part_id` is available
      const updatedStage = "Approver4 Stage Completed"; // Set the stage value to "Inspection Stage Completed"

      // Send request to update the part table with approval status and stage
      try {
        const response = await fetch('http://192.168.68.56:5000/api/updatePartStage', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            part_id: partId,
            stage: updatedStage, // Set the stage to "Inspection Stage Completed"
            approval_status: approvalStatus, // Set the approval status to "Approved" or "Rejected"
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error updating part stage and approval status: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log('Part stage and approval status updated successfully:', data);
      } catch (error) {
        console.error('Error updating part stage and approval status:', error);
      }

    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'An error occurred');
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
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
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Remark by Approver</Text></DataTable.Title>
    <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Remark by Approver2</Text></DataTable.Title>
    <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Remark by Approver3</Text></DataTable.Title>
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Image</Text></DataTable.Title>
          
          <DataTable.Title style={styles.headerText}><Text style={{ fontWeight: "bold", fontSize: 14, color: "white"}}>Remark by Approver4</Text></DataTable.Title>
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
              <DataTable.Cell>{item.remark_by_approver}</DataTable.Cell>
      <DataTable.Cell>{item.remark_by_approver2}</DataTable.Cell>
       <DataTable.Cell>{item.remark_by_approver3}</DataTable.Cell>
  
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
                  {item.remark_by_approver4 ? (
                    <>
                      <Text style={styles.valueText}>{item.remark_by_approver4}</Text>
                      <View style={{ flexDirection: "column", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => handleInputModal(item, 'remark_by_approver4')}>
                          <Text style={styles.iconText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteInput(item, 'remark_by_approver4')}>
                          <Text style={styles.iconText}>➖</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => handleInputModal(item, 'remark_by_approver4')}>
                      <Text style={styles.iconText}>➕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </ScrollView>
      </DataTable>
       <View style={styles.buttonContainer}>
    <TouchableOpacity
      style={[styles.actionButton, styles.approveButton]}
      onPress={() => handleApproveReject('Approved')}
    >
      <Text style={styles.buttonText}>Approve</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.actionButton, styles.rejectButton]}
      onPress={() => handleApproveReject('Rejected')}
    >
      <Text style={styles.buttonText}>Reject</Text>
    </TouchableOpacity>
  </View>

  
      {/* Modal for Input */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder={inputType === 'remark_by_approver3' ? 'Enter Remark_by_approver4' : ''}
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
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: { color: '#fff', fontSize: 12 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 250, padding: 20, backgroundColor: '#fff', borderRadius: 8 },
  input: { borderBottomWidth: 1, marginBottom: 10 },
  saveButton: { padding: 10, backgroundColor: '#007bff', alignItems: 'center', marginBottom: 10 },
  cancelButton: { padding: 10, backgroundColor: '#6c757d', alignItems: 'center' },
  imageCell: { flex: 1, alignItems: "center", flexWrap: "wrap" },
  valueText: {
    fontSize: 12,
    textAlign: 'center',
    marginRight: 5,
    color: '#333',
  },
  imagePreview: { width: 50, height: 50, borderRadius: 5 },
});

export default ApproverPage4;
