import axios from 'axios'

const BASE_URL = "http://192.168.68.51:5000/api"; // For Android Emulator (Use localhost for iOS)

interface Unit {
    id: number;
    name: string;
}

export const getUnits = async (): Promise<Unit[]> => {
    try {
        const response = await axios.get<Unit[]>(`${BASE_URL}/units`);
        return response.data;
    } catch (error) {
        console.error("Error fetching units:", error);
        return [];
    }
};

export const getLines = async (unitId: number) => {
    try {
        const response = await axios.get(`${BASE_URL}/lines/${unitId}/lines`);
        return response.data;
    } catch (error) {
        console.error("Error fetching lines:", error);
        return [];
    }
};

export const getEquipment = async (lineId: number) => {
    try {
        const response = await axios.get(`${BASE_URL}/equipment/${lineId}/equipment`);
        return response.data;
    } catch (error) {
        console.error("Error fetching equipment:", error);
        return [];
    }
};

export const getParts = async (equipmentId: number) => {
    try {
        const response = await axios.get(`${BASE_URL}/parts/${equipmentId}/parts`);
        return response.data;
    } catch (error) {
        console.error("Error fetching parts:", error);
        return [];
    }
};

export const getChecklist = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/checklist`);
        return response.data;
    } catch (error) {
        console.error("Error fetching checklist:", error);
        return [];
    }
};

export const updateChecklist = async (checklistData: any) => {
    try {
        const response = await axios.post(`${BASE_URL}/updateChecklist`, checklistData);
        return response.data;
    } catch (error) {
        console.error("Error updating checklist:", error);
        return null;
    }
};

export const afterMaintenance = async(checklistData:any) =>{
    try{
        const response = await axios.post(`${BASE_URL}/updateAfterMaintenance`, checklistData);
        return response.data;
    }catch(error){
        console.error("Error updating Maintenance:",error);
        return null;
    }
};