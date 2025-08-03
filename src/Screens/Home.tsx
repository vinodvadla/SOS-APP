import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { VibrationUtils } from '../utils/VibrationUtils';
import { SendDirectSms } from 'react-native-send-direct-sms';
import { useAuth } from '../AuthContex';

const Home = ({navigation}:any) => {
  const { db } = useAuth();
  const [isPressed, setIsPressed] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [countdown, setCountdown] = useState<number|null>(null);
  const [isActivated, setIsActivated] = useState(false);
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCancelTimeoutRef = useRef<NodeJS.Timeout | null>(null);




  function sendSmsData(mobileNumber:string, bodySMS:string) {
    SendDirectSms("+91"+mobileNumber, bodySMS)
      .then((res) => console.log("then", res))
      .catch((err) => console.log("catch", err))
  }


  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      // Clean up any running timers
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (autoCancelTimeoutRef.current) {
        clearTimeout(autoCancelTimeoutRef.current);
      }
    };
  }, []);

  const handleSOSPress = () => {
    if (isActivated) return;

    setIsPressed(true);
    VibrationUtils.vibrateNotification();
    
    let count = 3;
    setCountdown(count);
    
    // Start countdown interval
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        activateSOS();
      }
    }, 1000);

    // Auto-cancel after 3 seconds if button is still pressed
    autoCancelTimeoutRef.current = setTimeout(() => {
      if (isPressed && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);
        setIsPressed(false);
        VibrationUtils.vibrateError();
      }
    }, 3000);
  };

  const handleSOSRelease = () => {
    // Cancel countdown if button is released before 3 seconds
    if (countdown !== null && countdown > 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (autoCancelTimeoutRef.current) {
        clearTimeout(autoCancelTimeoutRef.current);
        autoCancelTimeoutRef.current = null;
      }
      
      setIsPressed(false);
      setCountdown(null);
      VibrationUtils.vibrateError();
    }
  };

  const activateSOS = () => {
    setIsActivated(true);
    setIsPressed(false);
    setCountdown(null);
    
    // Clear any remaining timers
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoCancelTimeoutRef.current) {
      clearTimeout(autoCancelTimeoutRef.current);
      autoCancelTimeoutRef.current = null;
    }
    
    VibrationUtils.vibrateSOS();
    
    // Send SMS to emergency contacts
    sendEmergencySMS();
    
    Alert.alert(
      'SOS Activated!',
      'Emergency alert has been sent to your contacts.',
      [
        {
          text: 'Cancel Alert',
          onPress: () => {
            setIsActivated(false);
            VibrationUtils.vibrateNotification();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const sendEmergencySMS = () => {
    // Get selected contacts from database and send SMS
    if (!db) {
      console.error('Database not available');
      return;
    }

    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM Contacts',
        [],
        (tx: any, result: any) => {
          if (result && result.rows && result.rows.length > 0) {
            const selectedContacts = result.rows.raw();
            console.log('Selected contacts for SMS:', selectedContacts);
            
            selectedContacts.forEach((contact: any) => {
              const messageBody = `🚨 EMERGENCY SOS ALERT 🚨\n\nThis is an emergency alert from ${contact.name || 'your emergency contact'}.\n\nI need immediate assistance. Please respond or call emergency services if needed.\n\nLocation: [GPS coordinates will be added]\nTime: ${new Date().toLocaleString()}`;
              
              sendSmsData(contact.mobile, messageBody);
            });
          } else {
            console.log('No selected contacts found');
          }
        },
        (error: any) => {
          console.error('Error fetching selected contacts:', error);
        },
      );
    });
  };

  const navigateToContacts = () => {
    VibrationUtils.vibrateNotification();
    navigation.navigate("Contacts");
  };
  

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <Text style={styles.headerSubtitle}>
          {isActivated ? 'Alert Active' : 'Hold button for 3 seconds'}
        </Text>
      </View>

      {/* Main SOS Button Area */}
      <View style={styles.sosContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: isPressed ? 0.8 : 0.3,
            },
          ]}
        />
        
        <TouchableOpacity
          style={[
            styles.sosButton,
            isPressed && styles.sosButtonPressed,
            isActivated && styles.sosButtonActivated,
          ]}
          onPressIn={handleSOSPress}
          onPressOut={handleSOSRelease}
          activeOpacity={0.8}
        >
          <View style={styles.sosButtonInner}>
            {countdown !== null ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : (
              <>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSubtext}>
                  {isActivated ? 'ACTIVE' : 'EMERGENCY'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={navigateToContacts}
        >
          <Text style={styles.actionButtonText}>📞 Contacts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          • Press and hold SOS button for 3 seconds
        </Text>
        <Text style={styles.instructionText}>
          • Release to cancel during countdown
        </Text>
        <Text style={styles.instructionText}>
          • Alert will be sent to emergency contacts
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pulseRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#ff4757',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4757',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  sosButtonPressed: {
    backgroundColor: '#ff3742',
    transform: [{ scale: 0.95 }],
  },
  sosButtonActivated: {
    backgroundColor: '#ff6b7a',
  },
  sosButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  sosSubtext: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: 1,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#16213e',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  instructionText: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default Home;