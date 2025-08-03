import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../AuthContex';
import { VibrationUtils } from '../utils/VibrationUtils';

const { width } = Dimensions.get('window');


const ContactsScreen = ({ navigation }: any) => {
  const { db } = useAuth();
  const [contacts, setContacts] = useState<any>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const getContacts = () => {
    db?.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Contacts',
        [],
        (tx: any, result: any) => {
          console.log('Fetched users result:', result);
          if (result && result.rows && result.rows.length > 0) {
            const contactsData = result.rows.raw();
            console.log('Raw contacts data:', contactsData);
            const contactsWithSelection = contactsData.map((contact: any) => ({
              ...contact,
              isSelected: false,
            }));
            console.log('Setting contacts:', contactsWithSelection);
            setContacts(contactsWithSelection);
          } else {
            console.log('No contacts found in database');
            setContacts([]);
          }
        },
        error => {
          console.error('Error fetching users:', error);
          setContacts([]);
        },
      );
    });
  };
  const toggleContact = (id: any) => {
    VibrationUtils.vibrateNotification(); // Add haptic feedback
    setContacts(
      contacts.map((contact: any) =>
        contact.id === id
          ? { ...contact, isSelected: !contact.isSelected }
          : contact,
      ),
    );
  };

  const addContact = (name: string, mobile: string) => {
    if (!name.trim() || !mobile.trim()) {
      VibrationUtils.vibrateError(); 
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    db?.transaction(tx => {
      tx.executeSql(
        'INSERT INTO Contacts (name, mobile) VALUES (?, ?)',
        [name.trim(), mobile.trim()],
        result => {
          console.log('User added successfully:', result);
          VibrationUtils.vibrateSuccess();
          setNewContactName('');
          setNewContactPhone('');
          setShowAddModal(false);
          getContacts();
          Alert.alert('Success', 'Contact added successfully');
        },
        error => {
          console.error('Error adding user:', error);
          VibrationUtils.vibrateError();
          Alert.alert('Error', 'Failed to add contact');
        },
      );
    });
  };

  const deleteContact = (id: any) => {
    VibrationUtils.vibrateNotification();
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            db?.transaction(tx => {
              tx.executeSql(
                'DELETE FROM Contacts WHERE id = ?',
                [id],
                result => {
                  console.log('Contact deleted successfully:', result);
                  VibrationUtils.vibrateSuccess();
                  setContacts(
                    contacts.filter((contact: any) => contact.id !== id),
                  );
                  Alert.alert('Success', 'Contact deleted successfully');
                },
                error => {
                  console.error('Error deleting contact:', error);
                  VibrationUtils.vibrateError();
                  Alert.alert('Error', 'Failed to delete contact');
                },
              );
            });
          },
        },
      ],
    );
  };

  const selectedCount = contacts.filter(
    (contact: any) => contact.isSelected,
  ).length;

  const renderContact = ({ item }: any) => (
    <View style={styles.contactItem}>
      <TouchableOpacity
        style={styles.contactInfo}
        onPress={() => toggleContact(item.id)}
      >
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.mobile}</Text>
        </View>

        <View
          style={[styles.checkbox, item.isSelected && styles.checkboxSelected]}
        >
          {item.isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteContact(item.id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    getContacts();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Selected Count */}
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected for
          emergency alerts
        </Text>
      </View>

      {/* Add Contact Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          VibrationUtils.vibrateNotification();
          setShowAddModal(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add New Contact</Text>
      </TouchableOpacity>

      {/* Contacts List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={item => item.id}
        style={styles.contactsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No contacts added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add emergency contacts to receive SOS alerts
            </Text>
          </View>
        }
      />

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              placeholderTextColor="#a0a0a0"
              value={newContactName}
              onChangeText={setNewContactName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#a0a0a0"
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  addContact(newContactName, newContactPhone);
                }}
              >
                <Text style={styles.saveButtonText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.infoText}>
          Selected contacts will receive SMS and call alerts when SOS is
          activated
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 60,
  },
  selectedInfo: {
    backgroundColor: '#16213e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedText: {
    color: '#4fc3f7',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4fc3f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  checkboxSelected: {
    backgroundColor: '#4fc3f7',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#a0a0a0',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 25,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#2a3f5f',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#4fc3f7',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomInfo: {
    backgroundColor: '#16213e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ContactsScreen;
