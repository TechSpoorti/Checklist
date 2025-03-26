import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, TextInput, PermissionsAndroid } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/StackNavigator';
import ImagePicker from 'react-native-image-crop-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import axios, { AxiosError } from 'axios';
import { DataTable } from "react-native-paper";
import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { ScrollView } from 'react-native';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
type ChecklistItem = {
  checklist_id: number;
  part_id: number;
  param: string;
  ptype: string;
  stdVal: string;
  unit: string;
  inspection_condition: string;
  measured_value: string;
  after_maintenance_value: string;
  remark: string;
  captured_image_after_inspection: string | null;
};

type ChecklistScreenProps = NativeStackScreenProps<RootStackParamList, 'ChecklistScreen'>;

const ChecklistScreen: React.FC<ChecklistScreenProps> = ({ route, navigation }) => {

  const { part_id, role } = route.params;
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [inputType, setInputType] = useState<'measured_value' | 'remark' | 'after_maintenance_value' | ' inspection_condition' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [conditions, setConditions] = useState<{ ID: number; condition_type: string }[]>([]);



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
          measured_value: '',
          after_maintenance_value: '',
          remark: '',
          inspection_condition: item.inspection_condition,
          image: null,
        })));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching checklist data:', error);
        setLoading(false);
      });
  }, [part_id]);

 
  const handleImagePick = (index: number) => {
    const item = checklistData[index];
    const existingImage = item.captured_image_after_inspection;

    if (existingImage) {
      // If an image already exists, ask the user if they want to recapture it
      Alert.alert(
        'Recapture Image',
        'An image already exists for this item. Do you want to recapture it?',
        [
          {
            text: 'Recapture',
            onPress: () => openCamera(index), // Allow recapture if they choose
          },
          {
            text: 'Use Existing Image',
            onPress: () => {
              // Just do nothing, the existing image is already used
              console.log('Using existing image.');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel', // Allow the user to cancel
          },
        ]
      );
    } else {
      // If no image exists, open the camera directly
      openCamera(index);
    }
  };

  // Helper function to open the camera
  const openCamera = async (index: number) => {
    try {
      const image = await ImagePicker.openCamera({
        width: 300,
        height: 300,
        cropping: true,
      });

      if (image && image.path) {
        await requestPermissions(); // Request permissions for external storage
        const item = checklistData[index];

        // Directory where the images will be stored
        const directoryPath = `${RNFS.ExternalStorageDirectoryPath}/Download/captured_images/`;

        // Ensure the directory exists
        const exists = await RNFS.exists(directoryPath);
        if (!exists) {
          await RNFS.mkdir(directoryPath);  // Create the folder if it doesn't exist
        }

        // Define a unique name for the file
        const fileName = `${item.checklist_id}_insp2.jpg`;
        const destinationPath = `${directoryPath}${fileName}`;

        // Move the file to the desired directory
        await RNFS.moveFile(image.path, destinationPath);
        console.log('Image moved to:', destinationPath);

        // Update the inspection data with the new image path
        // const updatedData = [...inspectionData];
        // updatedData[index].captured_image_during_inspection = destinationPath; // Update the image path
        // setInspectionData(updatedData);

        // After saving the image locally, upload it to the server
        uploadImageToServer(destinationPath, index);


        Alert.alert('Success', `Image saved and filename uploaded successfully.`);
      }
    } catch (error) {
      console.log("Image selection canceled:", error);
      Alert.alert('Notice', 'You have canceled the image selection. Please try again.');
    }
  };

  // Function to upload the image to the server
  const uploadImageToServer = async (imagePath: string, index: number) => {
    try {
      // Check if the file exists
      const fileExists = await RNFS.exists(imagePath);
      if (!fileExists) {
        Alert.alert('Upload Failed', 'File does not exist.');
        return;
      }

      const fileName = imagePath.split('/').pop();
      const response = await fetch(`file://${imagePath}`);
      const blob = await response.blob();

      // Create a FormData object
      const formData = new FormData();
      formData.append('image', {
        uri: `file://${imagePath}`,
        name: fileName,
        type: blob.type || 'image/jpg',
      });

      // Upload the image using Axios
      const uploadResponse = await axios.post('http://192.168.68.56:8080/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload Response:', uploadResponse.data);
      const uploadedImagePath = `/images/${fileName}`;// Assuming the server stores images in this path

      // Update the inspectionData with the uploaded image path
      const updatedData = [...checklistData];
      updatedData[index].captured_image_after_inspection = uploadedImagePath;
      setChecklistData(updatedData);

      Alert.alert('Success', `Your image has been successfully uploaded to the server!\nStored at: ${uploadedImagePath}`);

    } catch (error) {
      console.error('Error Details:', error);
      let errorMessage = '';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Server Response: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
          errorMessage = 'No response received from server. Check your network.';
        } else {
          errorMessage = `Axios Error: ${error.message}`;
        }
      } else {
        errorMessage = `Unexpected Error: ${JSON.stringify(error)}`;
      }

      Alert.alert('Upload Failed', errorMessage);
    }
  };
  const handleInputModal = (item: ChecklistItem, type: 'measured_value' | 'remark' | 'after_maintenance_value') => {
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



  const handleDeleteInput = (item: ChecklistItem, type: 'measured_value' | 'remark' | 'after_maintenance_value') => {
    const updatedData = checklistData.map(entry =>
      entry.checklist_id === item.checklist_id ? { ...entry, [type]: null } : entry
    );
    setChecklistData(updatedData);
  };

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to save the file.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission granted');
      } else {
        console.log('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSubmit = async () => {
    try {
      // Step 1: Request necessary permissions

      // Step 2: Validate checklist data before proceeding
      const incompleteFields = checklistData.filter(item =>
        !item.param || !item.stdVal || !item.unit ||
        (!item.measured_value && !item.after_maintenance_value) ||
        !item.remark
      );

      if (incompleteFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
        return;
      }
      await requestPermissions();

      // Step 3: Update checklist data on the server
      const updatePromises = checklistData.map(async (item) => {
        const updatedItem = {
          ...item,
          captured_image_after_inspection: item.captured_image_after_inspection || 'NA',
        };

        return fetch('http://192.168.68.56:5000/api/updateChecklist', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedItem),
        })
          .then(response => {
            if (!response.ok) {
              return response.text().then(text => {
                throw new Error(`Server Error: ${response.status} - ${text}`);
              });
            }
            return response.json();
          })
          .then(data => console.log('Checklist updated successfully:', data))
          .catch(error => console.error('Error updating checklist item:', error));
      });

      await Promise.all(updatePromises);

      // Step 4: Update the part stage
      const updatePartStage = async () => {
        const partId = String(part_id);
        const updatedStage = "After Inspection Stage Completed";
        const approvalStatus = "Second inspection completed";

        try {
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
            throw new Error(`Error updating part stage: ${response.status} - ${text}`);
          }

          const data = await response.json();
          console.log('Part stage updated successfully:', data);
        } catch (error) {
          console.error('Error updating part stage:', error);
        }
      };

      await updatePartStage();

      // Step 5: Prepare file paths for PDF generation
      const downloadFolderPath = RNFS.DownloadDirectoryPath;
      const pdfFolderPath = `${downloadFolderPath}/pdf`;

      const partId = String(part_id);
      const fileName = `Checklist_${partId}.pdf`;
      const filePath = `${pdfFolderPath}/${fileName}`;

      // Ensure the directory exists
      const exists = await RNFS.exists(pdfFolderPath);
      if (!exists) {
        await RNFS.mkdir(pdfFolderPath);
      }

      console.log("Final file path: ", filePath);

      // Step 6: Generate the HTML content for the PDF
      let htmlContent = `
              <h2>Checklist Report</h2>
              <p><strong>Part ID:</strong> ${partId}</p>
              <table border="1" cellspacing="0" cellpadding="5">
                  <tr>
                      <th>Parameter</th>
                      <th>Standard Value</th>
                      <th>Measured Value</th>
                      <th>After Maintenance Value</th>
                      <th>Unit</th>
                      <th>Remark</th>
                      <th>Images</th>
                  </tr>
                  ${checklistData.map(item => `
                      <tr>
                          <td>${item.param}</td>
                          <td>${item.stdVal}</td>
                          <td>${item.measured_value || '-'}</td>
                          <td>${item.after_maintenance_value || '-'}</td>
                          <td>${item.unit}</td>
                          <td>${item.remark || '-'}</td>
                          <td>
                              ${item.captured_image_after_inspection && item.captured_image_after_inspection !== 'NA'
          ? `<img src="http://192.168.68.56:8080${item.captured_image_after_inspection}" width="100" height="100"/>`
          : '-'}
                          </td>
                      </tr>
                  `).join('')}
              </table>
          `;

      console.log('Generated HTML Content:', htmlContent);

      // Step 7: Generate the PDF file from HTML content
      let options = {
        html: htmlContent,
        fileName: `Checklist_${partId}`,
        directory: 'Documents',
      };

      let file;
      try {
        file = await RNHTMLtoPDF.convert(options);
        console.log('PDF Generated:', file.filePath);
      } catch (pdfError) {
        console.error('Error during PDF generation:', pdfError);
        Alert.alert('Error', 'Failed to generate PDF');
        return;
      }

      // Step 8: Move the generated file to the desired folder
      if (file.filePath) {
        try {
          await RNFS.moveFile(file.filePath, filePath);
          console.log('File moved successfully:', filePath);
        } catch (moveError) {
          console.error('Error moving file:', moveError);
          Alert.alert('Error', 'Failed to save PDF file');
          return;
        }
      } else {
        console.error('File path is undefined');
        Alert.alert('Error', 'File path is undefined');
        return;
      }

      // Step 9: Alert user & navigate
      Alert.alert('Success', `PDF saved at:\n${filePath}`);
      navigation.navigate('ApproverPage', { part_id: part_id, role });

    } catch (error) {
      console.log('Error Generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }
  useEffect(() => {
    if (modalVisible) {
        fetch("http://192.168.68.56:5000/api/conditions")
            .then((response) => response.json())
            .then((data) => setConditions(data))
            .catch((error) => console.error("Error fetching conditions:", error));
    }
}, [modalVisible]);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inspection for Part ID: {part_id}</Text>

      <DataTable style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5 }}>
        <DataTable.Header style={{ backgroundColor: "#007BFF", borderBottomWidth: 1, borderColor: "#ccc", borderRightWidth: 1 }}>
          <DataTable.Title ><Text style={styles.headerText}>Param</Text></DataTable.Title>
          {false && (<DataTable.Title><Text style={styles.headerText}>Inspection_Condition</Text></DataTable.Title>)}
          <DataTable.Title><Text style={styles.headerText}>Std. Val</Text></DataTable.Title>
          <DataTable.Title ><Text style={styles.headerText}>Unit</Text></DataTable.Title>
          <DataTable.Title ><Text style={styles.headerText}>Measured</Text></DataTable.Title>
          <DataTable.Title ><Text style={styles.headerText}>After Maintenance</Text></DataTable.Title>

          <DataTable.Title ><Text style={styles.headerText}>Remark</Text></DataTable.Title>
          <DataTable.Title style={{ borderRightWidth: 1, borderColor: "#000" }}><Text style={styles.headerText}>Image</Text></DataTable.Title>
        </DataTable.Header>

        {/* Table Rows */}

        <ScrollView style={{ maxHeight: 110 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}  // Adds extra space to avoid overlap
          keyboardShouldPersistTaps="handled">
          {checklistData.map((item, index) => (
            <DataTable.Row key={item.checklist_id || index} style={{
              borderBottomWidth: 1, borderColor: "#ccc", backgroundColor:
                item.inspection_condition === "with_criteria"
                  ? item.measured_value && (item.measured_value < item.stdVal || item.measured_value > item.stdVal)
                    ? "red"
                    : "transparent"
                  : item.measured_value === "Bad" // For "without_criteria"
                    ? "red"
                    : "transparent"
            }}>
              <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000"
              }}>{item.param}</DataTable.Cell>
              {false && (<DataTable.Cell>{item.inspection_condition}</DataTable.Cell>)}
              <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000"
              }}>{item.stdVal}</DataTable.Cell>
              <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000"
              }}>{item.unit}</DataTable.Cell>

              {/* Measured Value */}
              <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000"
              }}

              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  {item.measured_value ? (
                    <>
                      <Text style={styles.valueText}>{item.measured_value}</Text>
                      <View style={{ flexDirection: "column", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => handleInputModal(item, 'measured_value')}>
                          <Text style={styles.iconText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteInput(item, 'measured_value')}>
                          <Text style={styles.iconText}>➖</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => handleInputModal(item, 'measured_value')}>
                      <Text style={styles.iconText}>➕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell>

              {/* After Maintenance Value */}
              <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000"
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  {item.after_maintenance_value ? (
                    <>
                      <Text style={styles.valueText}>{item.after_maintenance_value}</Text>
                      <View style={{ flexDirection: "column", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => handleInputModal(item, 'after_maintenance_value')}>
                          <Text style={styles.iconText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteInput(item, 'after_maintenance_value')}>
                          <Text style={styles.iconText}>➖</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => handleInputModal(item, 'after_maintenance_value')}>
                      <Text style={styles.iconText}>➕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell>

              {/* Remark */}
              <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000", padding: 12,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  {item.remark ? (
                    <>

                      <Text style={[styles.valueText, { flex: 1, flexWrap: "wrap", marginRight: 4 }]}>
                        {item.remark}</Text>
                      <View style={{ flexDirection: "column", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => handleInputModal(item, 'remark')}>
                          <Text style={styles.iconText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteInput(item, 'remark')}>
                          <Text style={styles.iconText}>➖</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => handleInputModal(item, 'remark')}>
                      <Text style={styles.iconText}>➕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell>

              {/* Image */}
              {/* <DataTable.Cell style={{
                borderRightWidth: 1, borderColor: "#000"
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  {item.captured_image_after_inspection ? (
                    <Image source={{ uri: item.captured_image_after_inspection }} style={styles.imagePreview} />
                  ) : (
                    <TouchableOpacity style={styles.smallButton} onPress={() => handleImagePick(index)}>
                      <Text style={styles.buttonText}>📷</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell> */}


              <DataTable.Cell>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.captured_image_after_inspection ? (
                    <Image
                      source={{ uri: `http://192.168.68.56:8080${item.captured_image_after_inspection}?t=${Date.now()}` }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <TouchableOpacity style={styles.smallButton} onPress={() => handleImagePick(index)}>
                      <Text style={styles.buttonText}>📷</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </DataTable.Cell>


            </DataTable.Row>
          ))}
        </ScrollView>
      </DataTable>

      <View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            {/* Conditional Rendering */}
            {selectedItem?.inspection_condition === "with_criteria" || inputType === "remark" ? (
              // TextInput for "with_criteria" and Remarks
              <TextInput
                style={styles.input}
                placeholder={
                  inputType === "measured_value"
                    ? "Enter Measured Value"
                    : inputType === "after_maintenance_value"
                      ? "Enter After Maintenance Value"
                      : inputType === "remark"
                        ? "Enter Remark"
                        : ""
                }
                value={inputValue}
                onChangeText={setInputValue}
              />
            ) : (
              // Selection for "without_criteria" (ONLY for Measured & After Maintenance values)
              <View>
              {conditions.map((condition) => (
                  <TouchableOpacity key={condition.ID} onPress={() => setInputValue(String(condition.ID))}>
                      <Text style={[styles.optionText, inputValue === String(condition.ID) && styles.selectedText]}>
                          ○ {condition.condition_type}
                      </Text>
                  </TouchableOpacity>
              ))}
          </View>
          
            )}

            {/* Save & Cancel Buttons */}
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
  // tableHeader: { flexDirection: 'row', backgroundColor: '#007bff', paddingVertical: 10 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,

    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  // headerText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#fff' },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    flex: 1, // This makes sure the columns are equally distributed


  },
  //newaly added
  imageCell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableContainer: { marginTop: 10, borderWidth: 1, borderColor: '#ccc' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  //cell: { fontSize: 12, textAlign: 'center' },
  // cell: {
  //   fontSize: 12,
  //   textAlign: 'center',
  //   flex: 1,
  // },

  // Value Cells for dynamic input (remarks, observation, etc.)
  valueCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    marginVertical: 8,
    color: "#555",
  },
  selectedText: {
    fontWeight: "bold",
    color: "#007BFF", // Highlight when selected
  },
  valueText: {
    fontSize: 12,
    textAlign: 'center',
    marginRight: 5,
    color: '#333',
  },
  iconText: {
    fontSize: 12,
    marginLeft: 5,
  },


  imagePreview: { width: 35, height: 35, borderRadius: 5, marginLeft: 5 },
  smallButton: { padding: 5, backgroundColor: '#007bff', borderRadius: 5, marginHorizontal: 2 },
  buttonText: { color: '#fff', fontSize: 12 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 250, padding: 20, backgroundColor: '#fff', borderRadius: 8 },
  input: { borderBottomWidth: 1, marginBottom: 10 },
  submitButton: { padding: 15, backgroundColor: '#007bff', borderRadius: 5, alignItems: 'center', marginTop: 20 },

  saveButton: { padding: 10, backgroundColor: '#28a745', borderRadius: 5, marginTop: 10 },
  cancelButton: { padding: 10, backgroundColor: '#dc3545', borderRadius: 5, marginTop: 5 },




});


export default ChecklistScreen;