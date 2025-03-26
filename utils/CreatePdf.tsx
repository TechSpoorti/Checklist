import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { Alert } from 'react-native';


const createPDFAndSave = async (checklistData: any[], partId: string) => {
    try {
        // Step 1: Ask the user to select a directory
        const result = await DocumentPicker.pickSingle({
            type: [DocumentPicker.types.allFiles], // Can be modified to specify types
        });

        // Extract the URI of the selected folder (works well on Android)
        const userSelectedPath = result.uri.replace('file://', '');

        // Ensure partId is a string
        const partIdStr = String(partId);

        // Define the file name for the PDF
        const fileName = `Checklist_Report_${partIdStr}.pdf`;
        const filePath = `${userSelectedPath}/${fileName}`;

        // Step 2: Create HTML content for the PDF
        let htmlContent = `
            <h2>Checklist Report</h2>
            <p><strong>Part ID:</strong> ${partIdStr}</p>
            <table border="1" cellspacing="0" cellpadding="5">
                <tr>
                    <th>Parameter</th>
                    <th>Standard Value</th>
                    <th>Measured Value</th>
                    <th>Unit</th>
                    <th>Remark</th>
                </tr>
                ${checklistData.map(item => ` 
                    <tr>
                        <td>${item.param}</td>
                        <td>${item.stdVal}</td>
                        <td>${item.measured_value || '-'}</td>
                        <td>${item.unit}</td>
                        <td>${item.remark || '-'}</td>
                    </tr>
                `).join('')}
            </table>
            <h3>Images:</h3>
            ${checklistData.map(item => item.image ? `<img src="${item.image}" width="100" height="100"/>` : '').join('')}
        `;

        // Step 3: Generate PDF
        const options = {
            html: htmlContent,
            fileName: `Checklist_Report_${partIdStr}`,
            directory: 'Documents', // Temporary directory for PDF generation
        };

        const file = await RNHTMLtoPDF.convert(options);
        console.log('PDF Generated:', file.filePath);

        // Step 4: Move the generated PDF to the user-selected path
        if (file.filePath && filePath) {
            await RNFS.moveFile(file.filePath, filePath);
            Alert.alert('Success', `PDF saved at: ${filePath}`);
        } else {
            Alert.alert('Error', 'Failed to generate the PDF.');
        }
    } catch (error) {
        console.error('Error generating or moving PDF:', error);
        Alert.alert('Error', 'There was an issue generating the PDF or selecting the directory');
    }
};

