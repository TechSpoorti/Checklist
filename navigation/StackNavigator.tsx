import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import UnitLinesScreen from '../screens/UnitLinesScreen';
import EquipmentScreen from '../screens/EquipmentScreen';
import PartScreen from '../screens/PartScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import LoginScreen from '../screens/LoginScreen';
import AfterMaintenance from '../screens/AfterMaintenance';
import ApproverPage from '../screens/ApproverPage';
import InspectionScreen from '../screens/InspectionScreen';
import ManagerScreen from '../screens/ManagerScreen';
import ApproverPage2 from '../screens/ApproverPage2';
import ApproverPage3 from '../screens/ApproverPage3';
import ApproverPage4 from '../screens/ApproverPage4';
import ApproverPage5 from '../screens/ApproverPage5';




export type AfterMaintenanceItem = {
    checklist_id: number;
    part_id: number;
    param: string;
    
    ptype: string;
    stdVal: string;
    unit: string;
    measured_value: string;
    after_maintenance_value:string;
    remark: string; // Or empty string based on your logic
    captured_image_after_inspection: string | null; // Assuming image can be a URL or null
};

export type InspectionItem ={
  checklist_id: number;
  part_id: number;
  parameter_name: string;
  inspection_condition: string;
  remarks_by_engineer: string;
  captured_image_during_inspection: string | null;
  material_required: string;
}

export type RootStackParamList = {
    LoginScreen : undefined;
    HomeScreen: {username:string,role:string};
    UnitLinesScreen: { unit_id: number,unit_name:string,role:string};
    EquipmentScreen: { line_id: number,line_name:string,role:string };
    PartScreen: { equipment_id: number,equipment_name:string,role:string};
    ChecklistScreen:{part_id:number,role:string};
    AfterMaintenance:{part_id:number;role:string};
    ApproverPage: { part_id:number;role:string};
    ApproverPage2:{part_id:number;role:string};
    ApproverPage3:{part_id:number;role:string}
    ApproverPage4:{part_id:number;role:string}
    ApproverPage5:{part_id:number;role:string}
    InspectionScreen:{part_id:number,role:string};
    ManagerScreen:{part_id:number,role:string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name ="LoginScreen" component={LoginScreen}/>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="UnitLinesScreen" component={UnitLinesScreen} />
            <Stack.Screen name="EquipmentScreen" component={EquipmentScreen} />
            <Stack.Screen name="PartScreen" component={PartScreen} />
            <Stack.Screen name="ChecklistScreen" component={ChecklistScreen}/>
            {/* <Stack.Screen name ="AfterMaintenance" component={AfterMaintenance}/> */}
            <Stack.Screen name ="ApproverPage" component={ApproverPage}/>
            <Stack.Screen name ="ApproverPage2" component={ApproverPage2}/>
            <Stack.Screen name ="ApproverPage3" component={ApproverPage3}/>
            <Stack.Screen name ="ApproverPage4" component={ApproverPage4}/>
            <Stack.Screen name ="ApproverPage5" component={ApproverPage5}/>
            <Stack.Screen name ="InspectionScreen" component={InspectionScreen}/>
            <Stack.Screen name ="ManagerScreen" component={ManagerScreen}/>
        </Stack.Navigator>
    );
};

export default StackNavigator;
