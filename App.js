import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, ScrollView, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import CallDetectorManager from 'react-native-call-detection';
import axios from 'axios';
import DeviceInfo from 'react-native-device-info';

const App = () => {
  const [featureOn, setFeatureOn] = useState(false);
  const [callLog, setCallLog] = useState([]);
  const [deviceId, setDeviceId] = useState(null);

  const askPermission = async () => {
    try {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ]);
      console.log('Permissions are:', permissions);
    } catch (err) {
      console.warn(err);
    }
  };

  const sendCallDetailsToBackend = async (callState, phoneNumber) => {
    try {
      const data = {
        CallState: callState,
        PhoneNumber: phoneNumber,
        AppId: deviceId,
      };
      const response = await axios.post('http://127.0.0.1:8000/calldetails/', data);
      console.log(response.data); // Log the response from the backend
    } catch (error) {
      console.error('Error sending call details to backend:', error);
    }
  };

  const startListenerTapped = () => {
    setFeatureOn(true);
    callDetector = new CallDetectorManager(
      (event, number) => {
        console.log(event, number);
        // Add the call event to the log only if it's picked or missed
        if (event === 'Offhook' || event === 'Missed') {
          setCallLog(prevLog => [{ event, number }, ...prevLog]);
          sendCallDetailsToBackend(event, number); // Send call details to backend
        }
      },
      true,
      () => {},
      {
        title: 'Phone State Permission',
        message: 'This app needs access to your phone state to react to incoming calls.',
      }
    );
  };

  const stopListenerTapped = () => {
    callDetector && callDetector.dispose();
    setFeatureOn(false);
  };

  useEffect(() => {
    const getDeviceId = async () => {
      const id = await DeviceInfo.getUniqueId();
      setDeviceId(id);
      console.log('Device ID:', id); // Log the device ID to the console
    };
    getDeviceId();
    askPermission();
    return () => {
      stopListenerTapped();
    };
  }, []);

  return (
    <View style={styles.body}>
      <Text style={{ color: 'black', fontSize: 26, fontWeight: '700' }}>
        Call Detection
      </Text>
      <Text style={[styles.text, { color: 'black' }]}>
        Should the detection be on?
      </Text>
      <TouchableHighlight
        style={{ borderRadius: 50 }}
        onPress={featureOn ? stopListenerTapped : startListenerTapped}>
        <View
          style={{
            width: 200,
            height: 200,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: featureOn ? 'blue' : '#eb4034',
            borderRadius: 50,
          }}>
          <Text style={styles.text}>{featureOn ? `ON` : `OFF`}</Text>
        </View>
      </TouchableHighlight>
      {/* Display call log */}
      <ScrollView style={{ flex: 1, width: '100%', marginTop: 20 }}>
        {callLog.map((log, index) => (
          <View key={index} style={{ marginBottom: 20, paddingLeft: 10 }}>
            <Text style={{ fontSize: 20, color: 'black' }}>
              Call status: {log.event === 'Offhook' ? 'Picked' : 'Missed'}
            </Text>
            <Text style={{ fontSize: 20, color: 'black' }}>
              Phone number: {log.number}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    padding: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
});
