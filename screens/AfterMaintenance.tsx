import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, Modal } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';


type AfterMaintenanceProps = NativeStackScreenProps<RootStackParamList, 'AfterMaintenance'>;

type AfterMaintenanceItem = {
  param: string;
  checklist_id: number;
  part_id: number;
  ptype: string;
  stdVal: string;
  unit: string;
  measured_value: string;
  after_maintenance_value: string; // New value for After Maintenance
  remark: string;
  captured_image_after_inspection: string | null;
};

const AfterMaintenance: React.FC<AfterMaintenanceProps> = ({ route, navigation }) => {
  const { checklistData }: { checklistData: AfterMaintenanceItem[] } = route.params;

  const [data, setData] = useState<AfterMaintenanceItem[]>(checklistData);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AfterMaintenanceItem | null>(null);
  const [inputType, setInputType] = useState<'after_maintenance_value' | 'remark' | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleImagePick = (index: number) => {
    ImagePicker.openCamera({
      width: 300,
      height: 300,
      cropping: true,
    }).then(image => {
      const updatedData = [...data];
      updatedData[index].captured_image_after_inspection = image.path;
      setData(updatedData);
    }).catch(error => console.log("Image selection canceled:", error));
  };

  const handleInputChange = (index: number, field: 'remark' | 'after_maintenance_value', value: string) => {
    const updatedData = [...data];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setData(updatedData);
  };

  const handleSaveInput = () => {
    if (selectedItem && inputType) {
      const updatedData = data.map(item =>
        item.checklist_id === selectedItem.checklist_id ? { ...item, [inputType]: inputValue } : item
      );
      setData(updatedData);
    }
    setModalVisible(false); // Close the modal after saving input
  };

  const handleDeleteInput = (index: number, field: 'remark' | 'after_maintenance_value') => {
    const updatedData = [...data];
    updatedData[index] = { ...updatedData[index], [field]: '' }; // Clear the input for the specific field
    setData(updatedData);
  };

  const handleSave = async () => {
    Alert.alert("Success", "Maintenance Data saved successfully!");
  
    // Save the checklist data to the server
    const updatePromises = data.map(item => {
      if (item.measured_value || item.remark || item.captured_image_after_inspection) {
        return fetch('http://192.168.68.51:5000/api/updateChecklist', {
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
            captured_image_after_inspection: item.captured_image_after_inspection, // Send the image path
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
      return null;
    });
  
    await Promise.all(updatePromises.filter(p => p !== null));
  
    // Generate the PDF after saving data
    try {
      // Step 1: Prepare PDF content
      const mappedData = data.map(item => ({
        ...item,
        after_maintenance_value: '',
      }));
  
      const downloadFolderPath = RNFS.DownloadDirectoryPath;
      const pdfFolderPath = `${downloadFolderPath}/pdf`;
  
      // Ensure part_id is a string
      const partId = String(data[0].part_id); // Assuming all items have the same part_id
  
      // Define the file name and path
      const fileName = `Checklist_${partId}.pdf`;
      const filePath = `${pdfFolderPath}/${fileName}`;
      console.log("Final file path: ", filePath); // Debugging line
  
      // Step 2: Create HTML content
      let htmlContent = `<h2>Checklist Report</h2>
      <p><strong>Part ID:</strong> ${partId}</p>
      <table border="1" cellspacing="0" cellpadding="5">
          <tr>
              <th>Parameter</th>
              <th>Standard Value</th>
              <th>Measured Value</th>
              <th>After_val</th>
              <th>Unit</th>
              <th>Remark</th>
              <th>Images</th>
          </tr>
          ${data.map(item => ` 
              <tr>
                  <td>${item.param}</td>
                  <td>${item.stdVal}</td>
                  <td>${item.measured_value || '-'}</td>
                  <td>${item.after_maintenance_value || '-'}</td>
                  <td>${item.unit}</td>
                  <td>${item.remark || '-'}</td>
                  <td>${item.captured_image_after_inspection? `<img src="${item.captured_image_after_inspection}" width="100" height="100"/>` : '-'}</td>
              </tr>
          `).join('')}
      </table>
      `;
  
      // Step 3: Generate PDF (saved temporarily)
      let options = {
        html: htmlContent,
        fileName: `Checklist_${partId}`,
        directory: 'Documents', // Temporary directory
      };
  
      let file = await RNHTMLtoPDF.convert(options);
      console.log('PDF Generated:', file.filePath);
  
      // Step 4: Move file to user-selected location
      if (file.filePath && filePath) {
        await RNFS.moveFile(file.filePath, filePath);
        Alert.alert('Success', `PDF saved at:\n${filePath}`);
      } else {
        console.error('filePath is undefined');
      }
      // navigation.navigate('ApproverPage', { checklistData: data, filePath: filePath });
    } catch (error) {
      console.log('Error Generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };
  

  const handleInputModal = (item: AfterMaintenanceItem, type: 'after_maintenance_value' | 'remark') => {
    setSelectedItem(item);
    setInputType(type);
    setInputValue(item[type]);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>After Maintenance</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { width: 50 }]}>Param</Text>
        <Text style={[styles.headerText, { width: 30 }]}>Std. Val</Text>
        <Text style={[styles.headerText, { width: 50 }]}>Unit</Text>
        <Text style={[styles.headerText, { width: 80 }]}>Measured</Text>
        <Text style={[styles.headerText, { width: 70 }]}>After_val</Text>
        <Text style={[styles.headerText, { width: 70 }]}>Remark</Text>
        <Text style={[styles.headerText, { width: 40 }]}>Img</Text>
      </View>

      {data.map((item, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.cell, { width: 50 }]}>{item.param}</Text>
          <Text style={[styles.cell, { width: 30 }]}>{item.stdVal}</Text>
          <Text style={[styles.cell, { width: 45 }]}>{item.unit}</Text>
          <Text style={[styles.cell, { width: 80 }]}>{item.measured_value}</Text>

          <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center' }}>
            {item.after_maintenance_value ? (
              <>
                <Text style={styles.valueText}>{item.after_maintenance_value}</Text>
                <TouchableOpacity onPress={() => handleInputModal(item, 'after_maintenance_value')}>
                  <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteInput(index, 'after_maintenance_value')}>
                  <Text style={styles.iconText}>➖</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => handleInputModal(item, 'after_maintenance_value')}>
                <Text style={styles.iconText}>➕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center' }}>
            {!item.remark ? (
              <TouchableOpacity onPress={() => handleInputModal(item, 'remark')}>
                <Text style={styles.iconText}>➕</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity onPress={() => handleInputModal(item, 'remark')}>
                  <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteInput(index, 'remark')}>
                  <Text style={styles.iconText}>➖</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={{ width: 40 }}>
            {item.captured_image_after_inspection ? (
              <Image source={{ uri: item.captured_image_after_inspection }} style={styles.imagePreview} />
            ) : (
              <TouchableOpacity style={styles.smallButton} onPress={() => handleImagePick(index)}>
                <Text style={styles.buttonText}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      {/* Modal for editing inputs */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit {inputType}</Text>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
          />
          <TouchableOpacity onPress={handleSaveInput} style={styles.saveButton}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f4f8' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#007bff', paddingVertical: 10 },
  headerText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#fff' },
  tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, padding: 8, backgroundColor: '#fff' },
  cell: { fontSize: 12, textAlign: 'center' },
  iconText:{fontSize:18},
  imagePreview: { width: 35, height: 35, borderRadius: 5, marginLeft: 5 },  
  smallButton: { padding: 5, backgroundColor: '#007bff', borderRadius: 5, marginHorizontal: 2 },
  buttonText: { color: '#fff', fontSize: 12 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 250, padding: 20, backgroundColor: '#fff', borderRadius: 8 },
  input: { borderBottomWidth: 1, marginBottom: 10 },
  submitButton:{padding:15,backgroundColor:'#007bff',borderRadius:5,alignItems:'center',marginTop:20},
  valueText:{fontSize:12,textAlign:'center',marginRight:5,color:'#333'},
  saveButton: { padding: 10, backgroundColor: '#28a745', borderRadius: 5, marginTop: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  cancelButton: { padding: 10, backgroundColor: '#dc3545', borderRadius: 5, marginTop: 5 },
});

export default AfterMaintenance;
