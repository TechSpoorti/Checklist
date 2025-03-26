import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, TextInput, FlatList, Platform, PermissionsAndroid } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/StackNavigator';
import ImagePicker from 'react-native-image-crop-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DocumentPicker from 'react-native-document-picker';
import { Alert } from 'react-native';
import axios, { AxiosError } from 'axios';
import RNFS from 'react-native-fs';
import { ScrollView } from 'react-native';
import Orientation from 'react-native-orientation-locker'; // Import Orientation Locker
import { DataTable } from "react-native-paper";


type InspectionItem = {
  checklist_id: number;
  part_id: number;
  parameter_name: string;
  standard_value: string;
  unit: string;
  inspection_condition: string;
  remarks_by_engineer: string;
  observation: string;
  captured_image_during_inspection: string | null; // Updated field name
  material_required: string;
  line_name: string;
  equipment_name: string;
  stage: string;
};

type InspectionScreenProps = NativeStackScreenProps<RootStackParamList, 'InspectionScreen'>;

const InspectionScreen: React.FC<InspectionScreenProps> = ({ route, navigation }) => {
  const { part_id, role } = route.params;
  const [inspectionData, setInspectionData] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null);
  const [inputType, setInputType] = useState<'remarks_by_engineer' | 'observation' | 'inspection_condition' | 'material_required' | "line_name" | "equipment_name" | "stage" | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Lock screen orientation when this screen is opened

    Orientation.lockToLandscape(); // Force landscape mode

    fetch(`http://192.168.68.56:5000/api/inspection?part_id=${part_id}`)
      .then(response => response.json())
      .then(data => {
        console.log("API Data: ", data);

        if (Array.isArray(data)) {
          setInspectionData(data.map((item: any) => ({
            checklist_id: item.checklist_id,
            part_id: item.part_id,
            parameter_name: item.parameter_name,
            standard_value: item.standard_value,
            unit: item.unit,
            inspection_condition: item.inspection_condition,
            remarks_by_engineer: item.remarks_by_engineer,
            observation: item.observation,
            captured_image_during_inspection: item.captured_image_during_inspection, // Updated field name
            material_required: item.material_required,
            line_name: item.line_name,
            equipment_name: item.equipment_name,
            stage: item.stage


          })));
        } else {
          console.error("Expected array, but received:", data);
          setInspectionData([]);
        }

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
  const handleImagePick = (index: number) => {
    const item = inspectionData[index];
    const existingImage = item.captured_image_during_inspection;

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
        const item = inspectionData[index];

        // Directory where the images will be stored
        const directoryPath = `${RNFS.ExternalStorageDirectoryPath}/Download/captured_images/`;

        // Ensure the directory exists
        const exists = await RNFS.exists(directoryPath);
        if (!exists) {
          await RNFS.mkdir(directoryPath);  // Create the folder if it doesn't exist
        }

        // Define a unique name for the file
        const fileName = `${item.checklist_id}_.jpg`;
        const destinationPath = `${directoryPath}${fileName}`;

        // Move the file to the desired directory
        await RNFS.moveFile(image.path, destinationPath);
        console.log('Image moved to:', destinationPath);



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
      const updatedData = [...inspectionData];
      updatedData[index].captured_image_during_inspection = uploadedImagePath;
      setInspectionData(updatedData);

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



  const handleDeleteInput = (item: InspectionItem, type: 'remarks_by_engineer' | 'observation' | 'inspection_condition' | 'material_required') => {
    const updatedData = inspectionData.map(entry =>
      entry.checklist_id === item.checklist_id ? { ...entry, [type]: null } : entry
    );
    setInspectionData(updatedData);
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




  const handleInputModal = (item: InspectionItem, type: 'remarks_by_engineer' | 'observation' | 'inspection_condition' | 'material_required') => {
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



  const handleSubmit = async () => {
    try {
      // Check if any required fields are empty (except the image)
      const incompleteFields = inspectionData.filter(item =>
        !item.inspection_condition ||
        !item.remarks_by_engineer ||
        !item.observation ||
        !item.material_required
      );

      if (incompleteFields.length > 0) {
        Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
        return; // Exit early if any fields are missing
      }

      await requestPermissions();

      const updatePromises = inspectionData.map(item => {
        // Ensure that the image field is either null or 'NA' if no image is captured
        const updatedItem = {
          ...item,
          captured_image_during_inspection: item.captured_image_during_inspection || 'NA', // Set to 'NA' if no image is available
        };

        // Only submit the data if any of the required fields are filled
        if (updatedItem.inspection_condition || updatedItem.remarks_by_engineer || updatedItem.observation || updatedItem.material_required) {
          return fetch('http://192.168.68.56:5000/api/updateInspection', {
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
            .then(data => {
              console.log('Inspection updated successfully:', data);
            })
            .catch(error => {
              console.error('Error updating checklist item:', error);
            });
        }

        return null;
      });

      await Promise.all(updatePromises.filter(p => p !== null));

      const updatePartStage = async () => {
        const partId = String(part_id); // Ensure `part_id` is available
        const updatedStage = "Inspection Stage Completed"; // Set the stage value to "Inspection Stage Completed"
        const approvalStatus = "Inspection Completed"
        // Send request to update the part table
        try {
          const response = await fetch('http://192.168.68.56:5000/api/updatePartStage', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              part_id: partId,
              stage: updatedStage,
              approval_status: approvalStatus // Set the stage to "Inspection Stage Completed"
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

      const downloadFolderPath = RNFS.DownloadDirectoryPath;
      const pdfFolderPath = `${downloadFolderPath}/pdf`;
      const partId = String(part_id);
      const fileName = `Inspection_${partId}.pdf`;
      const filePath = `${pdfFolderPath}/${fileName}`;

      let htmlContent = `
            <h2>Inspection Report</h2>
            <p><strong>Part ID:</strong> ${partId}</p>
            <table border="1" cellspacing="0" cellpadding="5">
              <tr>
                <th>Parameter</th>
                <th>Standard Value</th>
                <th>Unit</th>
                <th>Inspection Condition</th>
                <th>Remarks by Engineer</th>
                <th>Observation</th>
                <th>Material Required</th>
                <th>Photos (Before)</th>
              </tr>
              ${inspectionData.map(item => `
                <tr>
                  <td>${item.parameter_name}</td>
                  <td>${item.standard_value}</td>
                  <td>${item.unit}</td>
                  <td>${item.inspection_condition || '-'}</td>
                  <td>${item.remarks_by_engineer || '-'}</td>
                  <td>${item.observation || '-'}</td>
                  <td>${item.material_required || '-'}</td>
<td>
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
      navigation.navigate('ManagerScreen', { part_id, role });
    } catch (error) {
      console.log('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };


  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Inspection for Part ID: {part_id}</Text>

      <View style={{ paddingTop: 10, flex: 1 }}>

        {/* Scrollable Table Rows */}

        <DataTable style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5 }}>
          <DataTable.Header style={{ backgroundColor: "#007BFF", borderBottomWidth: 1, borderColor: "#ccc" }}>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Param</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Std Value</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Unit</Text></DataTable.Title>
            {/* <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>inspection_condition</Text></DataTable.Title> */}
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Observation</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Material</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Remarks</Text></DataTable.Title>
            <DataTable.Title><Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>Photos</Text></DataTable.Title>

          </DataTable.Header>


          {/* Table Rows */}
          <ScrollView style={{ maxHeight: 400 }}
            contentContainerStyle={{ paddingBottom: 80 }} // Adds extra space to avoid overlap
            keyboardShouldPersistTaps="handled">
            {inspectionData.map((item, index) => (
              <DataTable.Row key={item.checklist_id || index} style={{ borderBottomWidth: 1, borderColor: "#ccc" }}>
                <DataTable.Cell>{item.parameter_name}</DataTable.Cell>
                <DataTable.Cell>{item.standard_value}</DataTable.Cell>
                <DataTable.Cell>{item.unit}</DataTable.Cell>
                {/* <DataTable.Cell>{item.inspection_condition}</DataTable.Cell> */}


                {/* Observation Column */}
                <DataTable.Cell>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {item.observation ? (
                      <>
                        <Text style={styles.valueText}>{item.observation}</Text>
                        <View style={{ flexDirection: "column", alignItems: "center" }}>
                          <TouchableOpacity onPress={() => handleInputModal(item, "observation")}>
                            <Text style={styles.iconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteInput(item, "observation")}>
                            <Text style={styles.iconText}>➖</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity onPress={() => handleInputModal(item, "observation")}>
                        <Text style={styles.iconText}>➕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </DataTable.Cell>
                {/* Remarks Column */}
                <DataTable.Cell>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    {/* If there is a remark, show text and icons */}
                    {item.remarks_by_engineer ? (
                      <>
                        <Text style={[styles.valueText, { flex: 1, flexWrap: "wrap", marginRight: 4 }]}>
                          {item.remarks_by_engineer}
                        </Text>
                        {/* Icons stacked vertically */}
                        <View style={{ flexDirection: "column", alignItems: "center" }}>
                          <TouchableOpacity onPress={() => handleInputModal(item, "remarks_by_engineer")}>
                            <Text style={styles.iconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteInput(item, "remarks_by_engineer")}>
                            <Text style={styles.iconText}>➖</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      /* Show only ➕ icon when no remark is available */
                      <TouchableOpacity onPress={() => handleInputModal(item, "remarks_by_engineer")}>
                        <Text style={styles.iconText}>➕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </DataTable.Cell>



                {/* Material Required Column */}
                <DataTable.Cell>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {item.material_required ? (
                      <>
                        <Text style={styles.valueText}>{item.material_required}</Text>
                        <View style={{ flexDirection: "column", alignItems: "center" }}>
                          <TouchableOpacity onPress={() => handleInputModal(item, "material_required")}>
                            <Text style={styles.iconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteInput(item, "material_required")}>
                            <Text style={styles.iconText}>➖</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity onPress={() => handleInputModal(item, "material_required")}>
                        <Text style={styles.iconText}>➕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </DataTable.Cell>

                {/* Image Column */}
                <DataTable.Cell>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {item.captured_image_during_inspection ? (
                      <Image
                        source={{ uri: `http://192.168.1.101:8080${item.captured_image_during_inspection}?t=${Date.now()}` }}
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

      </View>

      {inspectionData.some(item => item.stage !== "Inspection Stage Completed") && (
  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
    <Text style={styles.buttonText}>Save</Text>
  </TouchableOpacity>
)}


      {/* Modal for Input */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder={inputType === "remarks_by_engineer" ? "Enter Remarks by Engineer" : "Enter Observation"}
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
  tableContainer: { borderWidth: 1, borderColor: "#ccc" },
  tableHeader: { flexDirection: "row", backgroundColor: "#eee", padding: 5 },
  headerText: {
    flex: 1, fontWeight: "bold", textAlign: "center", borderWidth: 1,       // Border for each column
    borderColor: "#000",  // Border color
    padding: 5,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 5, flexWrap: "wrap" },

  valueText: { flex: 1, flexShrink: 1, width: "90%", flexWrap: "wrap", },
  iconText: { fontSize: 10, marginHorizontal: 10 },
  imageCell: { flex: 1, alignItems: "center", flexWrap: "wrap" },
  imagePreview: { width: 50, height: 50, borderRadius: 5 },
  smallButton: { padding: 5, backgroundColor: "#ddd", borderRadius: 5 },
  buttonText: { fontSize: 20 },
  submitButton: { backgroundColor: "#007BFF", padding: 5, marginTop: 20, alignItems: "center" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, width: 200, marginBottom: 10, flexWrap: "wrap" },
});

export default InspectionScreen;