import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, TextInput, FlatList, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import ImagePicker from 'react-native-image-crop-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { ScrollView } from 'react-native';
import Orientation from 'react-native-orientation-locker'; // Import Orientation Locker
import { DataTable } from "react-native-paper";


type ManagersItem = {
  checklist_id: number;
  part_id: number;
  parameter_name: string;
  standard_value: string;
  unit: string;
  inspection_condition: string;
  remarks_by_engineer: string;
  observation: string;
  captured_image_during_inspection: string | null;
  material_required: string;
  action_to_be_taken: string;
  remarks_by_section_incharge: string;
  //remarks: string;
  line_name: string;
  equipment_name: string

};

type ManagerScreenProps = NativeStackScreenProps<RootStackParamList, 'ManagerScreen'>;

const ManagerScreen: React.FC<ManagerScreenProps> = ({ route, navigation }) => {
  const { part_id, role } = route.params;
  const [inspectionData, setInspectionData] = useState<ManagersItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ManagersItem | null>(null);
  const [inputType, setInputType] = useState<'remarks_by_engineer' | 'observation' | 'inspection_condition' | 'action_to_be_taken' | 'remarks_by_section_incharge' | 'remarks' | 'line_name' | 'equipment_name' | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    Orientation.lockToLandscape(); // Force landscape mode
    fetch(`http://192.168.68.56:5000/api/inspection?part_id=${part_id}`)
      .then(response => response.json())
      .then(data => {
        setInspectionData(data.map((item: any) => ({
          checklist_id: item.checklist_id,
          part_id: item.part_id,
          parameter_name: item.parameter_name,
          standard_value: item.standard_value,
          unit: item.unit,
          inspection_condition: item.inspection_condition,
          remarks_by_engineer: item.remarks_by_engineer,
          observation: item.observation,
          captured_image_during_inspection: item.captured_image_during_inspection,
          // captured_image_before_inspection: item.captured_image_before_inspection,
          material_required: item.material_required,
          action_to_be_taken: item.action_to_be_taken,
          remarks_by_section_incharge: item.remarks_by_section_incharge,
          // remarks: item.remarks,
          line_name: item.line_name,
          equipment_name: item.equipment_name

        })));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching inspection data:', error);
        setLoading(false);
      });
    return () => {
      Orientation.unlockAllOrientations(); // Reset orientation when leaving the screen
    };
  }, [part_id]);

  // const handleImagePick = (index: number, type: 'before' | 'after') => {
  //   ImagePicker.openCamera({
  //     width: 300,
  //     height: 300,
  //     cropping: true,
  //   }).then(image => {
  //     const updatedData = [...inspectionData];
  //     if (type === 'before') {
  //       updatedData[index].captured_image_during_inspection = image.path;
  //     } 
  //     setInspectionData(updatedData);
  //   }).catch(error => console.log("Image selection canceled:", error));
  // };

  const handleInputModal = (item: ManagersItem, type: 'remarks_by_engineer' | 'observation' | 'inspection_condition' | 'action_to_be_taken' | 'remarks_by_section_incharge') => {
    setSelectedItem(item);
    setInputType(type);
    setInputValue(item[type]);
    setModalVisible(true);
  };

  const handleSaveInput = () => {
    if (selectedItem && inputType) {
      const updatedData = inspectionData.map(item =>
        item.checklist_id === selectedItem.checklist_id ? { ...item, [inputType]: inputValue } : item
      );
      setInspectionData(updatedData);
    }
    setModalVisible(false);
  };

  const handleDeleteInput = (item: ManagersItem, type: 'remarks_by_engineer' | 'observation' | 'inspection_condition' | 'material_required' | 'action_to_be_taken' | 'remarks_by_section_incharge') => {
    const updatedData = inspectionData.map(entry =>
      entry.checklist_id === item.checklist_id ? { ...entry, [type]: null } : entry
    );

    // Update the state
    setInspectionData(updatedData);
  };


  // Function to handle form submission (save data to the database)
  const handleSubmit = async () => {
    try {
      // Check for missing required fields
      const incompleteFields = inspectionData.filter(item =>
        !item.inspection_condition ||
        !item.remarks_by_engineer ||
        !item.observation ||
        !item.material_required ||
        !item.action_to_be_taken ||
        !item.remarks_by_section_incharge
        //!item.remarks
      );

      if (incompleteFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all required fields before submitting.');
        return; // Exit early if any fields are missing
      }

      // Proceed with the submission after validation
      const updatePromises = inspectionData.map(item => {
        if (item.inspection_condition || item.remarks_by_engineer || item.observation || item.captured_image_during_inspection || item.action_to_be_taken || item.remarks_by_section_incharge) {
          return fetch('http://192.168.68.56:5000/api/updateManager', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              checklist_id: item.checklist_id,
              part_id: item.part_id,
              standard_value: item.standard_value,
              unit: item.unit,
              inspection_condition: item.inspection_condition,
              remarks_by_engineer: item.remarks_by_engineer,
              observation: item.observation,
              captured_image_during_inspection: item.captured_image_during_inspection,
              material_required: item.material_required,
              action_to_be_taken: item.action_to_be_taken,
              remarks_by_section_incharge: item.remarks_by_section_incharge,
              //remarks: item.remarks,
            }),
          })
            .then(response => response.json())
            .then(data => {
              console.log('Inspection updated successfully:', data);
            })
            .catch(error => {
              console.error('Error updating inspection item:', error);
            });
        }
        return null;
      });

      await Promise.all(updatePromises.filter(p => p !== null));

      // Function to update the part stage
      const updatePartStage = async () => {
        const partId = String(part_id); // Ensure `part_id` is available
        const updatedStage = "Manager Stage Completed"; // Set the stage value to "Inspection Stage Completed"
        const approvalStatus = "Manager Inspection Completed"
        // Send request to update the part table
        try {
          const response = await fetch('http://192.168.68.56:5000/api/updatePartStage', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              part_id: partId,
              stage: updatedStage, // Set the stage to "Inspection Stage Completed"
              approval_status: approvalStatus
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Error updating part stage: ${response.status} - ${text}`);
          }

          const data = await response.json();
          console.log('Part stage updated successfully:', data);
        } catch (error) {
          console.error('Error updating part stage:', error);
        }
      };

      // Call the function to update the part stage
      await updatePartStage();
      Alert.alert('Success', 'Data submitted successfully!');
    } catch (error) {
      console.log('Error submitting data:', error);
      Alert.alert('Error', 'Failed to submit data.');
    }
  };

  // Function to generate the JobCard PDF
  const generateJobCardPDF = async () => {
    try {
      // Validate required fields before proceeding
      const incompleteFields = inspectionData.filter(item =>
        !item.inspection_condition ||
        !item.remarks_by_engineer ||
        !item.observation ||
        !item.material_required ||
        !item.action_to_be_taken ||
        !item.remarks_by_section_incharge
      );

      if (incompleteFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all required fields before generating the Job Card.');
        return; // Exit early if validation fails
      }

      const downloadFolderPath = RNFS.DownloadDirectoryPath;
      const pdfFolderPath = `${downloadFolderPath}/pdf`;
      const partId = String(part_id);
      const fileName = `JobCard_${partId}.pdf`;
      const filePath = `${pdfFolderPath}/${fileName}`;

      let htmlContent = `
      <h2>Inspection Report</h2>
      <p><strong>Part ID:</strong> ${partId}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td colspan="8" style="text-align: center; font-size: 20px; font-weight: bold; padding: 10px; background-color: #ddd; border: 1px solid black">JOB CARD</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border: 1px solid black">PLANT</td>
          <td colspan="1" style="border: 1px solid black">${selectedItem?.line_name}</td>
          <td style="font-weight: bold; border: 1px solid black">MAKE</td>
          <td colspan="1" style="border: 1px solid black"></td>
          <td style="font-weight: bold; border: 1px solid black" colspan="2">APPLICATION</td>
          <td colspan="2" style="border: 1px solid black">-</td>
        </tr>
        ${inspectionData.map(item => `
          <tr>
            <td style="border: 1px solid black; padding: 8px; background-color: #f2f2f2;">${item.parameter_name}</td>
            <td style="border: 1px solid black; padding: 8px;">${item.observation || '-'}</td>
            <td style="border: 1px solid black; padding: 8px;">${item.remarks_by_engineer || '-'}</td>
            <td style="border: 1px solid black; padding: 8px;">${item.material_required || '-'}</td>
            <td style="border: 1px solid black; padding: 8px;">${item.action_to_be_taken || '-'}</td>
            <td style="border: 1px solid black; padding: 8px;">${item.remarks_by_section_incharge || '-'}</td>
            <td style="border: 1px solid black; padding: 8px;">
              ${item.captured_image_during_inspection
          ? `<img src="http://192.168.68.56:8080${item.captured_image_during_inspection}" width="100" height="100"/>`
          : '-'}
            </td>
          </tr>
        `).join('')}
      </table>
    `;

      let options = {
        html: htmlContent,
        fileName: `Inspection_${partId}`,
        directory: 'Documents',
      };

      let file = await RNHTMLtoPDF.convert(options);
      console.log('PDF Generated:', file.filePath);

      if (file.filePath && filePath) {
        RNFS.moveFile(file.filePath, filePath);
      } else {
        console.error('filePath is undefined');
      }

      Alert.alert('Success', `PDF saved at:\n${filePath}`);
    } catch (error) {
      console.log('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
    navigation.navigate('ChecklistScreen', { part_id, role });
  };


  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (

    <View style={styles.container}>
      <Text style={styles.header}>Manager's Inspection for Part ID: {part_id}</Text>

      <View style={{ paddingTop: 10, flex: 1 }}>
        <DataTable style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5 }}>
          <DataTable.Header style={{ backgroundColor: "#007BFF", borderBottomWidth: 1, borderColor: "#ccc" }}>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Param</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Std_Val</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Unit</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Remark By Engineer</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Obs</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Material Required</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Action Taken</Text></DataTable.Title>
            <DataTable.Title>
              <Text style={{ fontWeight: "bold", fontSize: 14, color: "white", flexWrap: "wrap" }} numberOfLines={2}>
                Remarks by Section Incharge
              </Text>
            </DataTable.Title>



            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Photos</Text></DataTable.Title>

          </DataTable.Header>

          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
            {inspectionData.map((item, index) => (
              <DataTable.Row key={item.checklist_id || index} style={{ borderBottomWidth: 1, borderColor: "#ccc" }}>
                <DataTable.Cell>{item.parameter_name}</DataTable.Cell>
                <DataTable.Cell>{item.standard_value}</DataTable.Cell>
                <DataTable.Cell>{item.unit}</DataTable.Cell>
                <DataTable.Cell>{item.remarks_by_engineer}</DataTable.Cell>
                <DataTable.Cell>{item.observation}</DataTable.Cell>
                <DataTable.Cell>{item.material_required}</DataTable.Cell>

                {/* Action Taken */}
                <DataTable.Cell>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    {item.action_to_be_taken ? (
                      <>
                        <Text style={[styles.valueText, { flex: 1, flexWrap: "wrap", marginRight: 4 }]}>
                          {item.action_to_be_taken}</Text>
                        <View style={{ flexDirection: "column", alignItems: "center" }}>
                          <TouchableOpacity onPress={() => handleInputModal(item, 'action_to_be_taken')}>
                            <Text style={styles.iconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteInput(item, 'action_to_be_taken')}>
                            <Text style={styles.iconText}>➖</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity onPress={() => handleInputModal(item, 'action_to_be_taken')}>
                        <Text style={styles.iconText}>➕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </DataTable.Cell>

                {/* Remarks by Section Incharge */}
                <DataTable.Cell>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    {item.remarks_by_section_incharge ? (
                      <>
                        <Text style={[styles.valueText, { flex: 1, flexWrap: "wrap", marginRight: 4 }]}>{item.remarks_by_section_incharge}</Text>
                        <View style={{ flexDirection: "column", alignItems: "center" }}>
                          <TouchableOpacity onPress={() => handleInputModal(item, 'remarks_by_section_incharge')}>
                            <Text style={styles.iconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteInput(item, 'remarks_by_section_incharge')}>
                            <Text style={styles.iconText}>➖</Text>
                          </TouchableOpacity>




                        </View>
                      </>
                    ) : (
                      <TouchableOpacity onPress={() => handleInputModal(item, 'remarks_by_section_incharge')}>
                        <Text style={styles.iconText}>➕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </DataTable.Cell>

                {/* Photos */}
                <DataTable.Cell>
                  <View style={styles.imageCell}>
                    {item.captured_image_during_inspection ? (
                      <Image source={{ uri: `http://192.168.68.56:8080${item.captured_image_during_inspection}` }} style={styles.imagePreview} />
                    ) : null}
                  </View>
                </DataTable.Cell>


              </DataTable.Row>
            ))}
          </ScrollView>
        </DataTable>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Inspection Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={generateJobCardPDF}>
          <Text style={styles.buttonText}>Generate JobCard</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder={inputType === 'remarks_by_engineer' ? "Enter Remarks by Engineer" : inputType === 'inspection_condition' ? "Enter Inspection Condition" : inputType === 'action_to_be_taken' ? "Enter Action Taken" : inputType === 'remarks_by_section_incharge' ? "Enter Remarks by Section Incharge" : "Enter Remarks"}
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
    </View>
  );

};

const styles = StyleSheet.create({

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
  horizontalScroll: { flex: 1, backgroundColor: '#f5f5f5' },
  verticalScroll: { flexGrow: 1, paddingVertical: 10 },
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },

  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 5, flexWrap: "wrap" },

  valueText: { flex: 1, flexShrink: 1, width: "90%", flexWrap: "wrap", },
  iconText: { fontSize: 10, marginHorizontal: 10 },
  imageCell: { flex: 1, alignItems: "center", flexWrap: "wrap" },
  imagePreview: { width: 50, height: 50, borderRadius: 5 },
  smallButton: { padding: 5, backgroundColor: "#ddd", borderRadius: 5 },
  buttonText: { fontSize: 12 },
  submitButton: { backgroundColor: "#007BFF", padding: 5, marginTop: 20, alignItems: "center" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, width: 200, marginBottom: 10, flexWrap: "wrap" },
  buttonContainer: {
    flexDirection: 'row',  // Makes buttons appear in one row
    justifyContent: 'space-around', // Space between buttons
    alignItems: 'center', // Align buttons vertically
    marginTop: 20,
  },
});

export default ManagerScreen;
