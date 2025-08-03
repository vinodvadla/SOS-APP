import { createContext, useContext, useEffect, useState } from 'react';
import SQLite from 'react-native-sqlite-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  db: SQLite.SQLiteDatabase | null;
  dbReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  db: null,
  dbReady: false,
});

export const AuthProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const database = SQLite.openDatabase(
          {
            name: 'SQLiteDemo.db',
            location: 'default',
          },
          () => {
            console.log('Database opened successfully');
            setDb(database);
            
            database.transaction(
              (tx: any) => {
                tx.executeSql(
                  "CREATE TABLE IF NOT EXISTS Contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, mobile TEXT)",
                  [],
                  () => {
                    console.log('Contacts table created successfully');
                    setDbReady(true);
                  },
                  (error: any) => {
                    console.error('Error creating Contacts table:', error);
                    setDbReady(true); // Still set ready even if table creation fails
                  }
                );
              },
              (error: any) => {
                console.error('Transaction error:', error);
                setDbReady(true);
              },
              () => {
                console.log('Database initialization completed');
              }
            );
          },
          (error: any) => {
            console.error('Error opening database:', error);
            setDbReady(true); // Set ready even if database fails to open
          }
        );
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbReady(true);
      }
    };

    initializeDatabase();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, db, dbReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
