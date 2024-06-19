import 'react-native-gesture-handler';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, Image, StyleSheet, StatusBar, Button, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/FontAwesome';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function DynamicScreen({ route }) {
  const { name, descrição } = route.params;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{name} Screen</Text>
      <Text>{descrição}</Text>
    </View>
  );
}

function WebViewScreen({ route }) {
  const { url, descrição } = route.params;
  return (
    <WebView source={{ uri: url }} style={{ flex: 1 }} />
  );
}

function ListScreen({ route, navigation }) {
  const { name, descrição, items } = route.params;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{name}</Text>
      <Text style={{ marginBottom: 16 }}>{descrição}</Text>
      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate(item.name, item)}>
            <Text style={{ fontSize: 16, padding: 8 }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function CustomDrawerContent(props) {
  const { corGeral, logoIconeApp } = props;

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
        <Image source={{ uri: logoIconeApp }} style={{ width: 100, height: 100, marginRight: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: corGeral }}>Meu App</Text>
      </View>
      {props.state.routes.map((route, index) => (
        <DrawerItem
          key={index}
          label={route.name}
          onPress={() => props.navigation.navigate(route.name)}
          icon={({ focused, color, size }) => {
            const { options } = props.descriptors[route.key];
            if (options.drawerIcon) {
              return <Icon name={options.drawerIcon({ focused, color, size }).props.name} color={color} size={size} />;
            } else {
              return null;
            }
          }}
        />
      ))}
    </DrawerContentScrollView>
  );
}

export default function App() {
  const [configApp, setConfigApp] = useState(null);
  const [menuLateral, setMenuLateral] = useState([]);
  const [menuBottom, setMenuBottom] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chamada de API para buscar as configurações globais e os menus
    axios.get('https://portosprivados.org.br/api.php')
      .then(response => {
        const { app, menulateral, menubottom } = response.data;
        setConfigApp(app);
        setMenuLateral(menulateral);
        setMenuBottom(menubottom);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  if (loading || !configApp) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  function Tabs() {
    return (
      <Tab.Navigator>
        {menuBottom.map((screen, index) => (
          <Tab.Screen
            key={index}
            name={screen.name}
            component={screen.type === 'webview' ? WebViewScreen : screen.type === 'lista' ? ListScreen : DynamicScreen}
            initialParams={screen}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Icon name={screen.icon} color={color} size={size} />
              )
            }}
          />
        ))}
      </Tab.Navigator>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={configApp.corGeral} barStyle="light-content" />
      <Drawer.Navigator drawerContent={props => <CustomDrawerContent {...props} corGeral={configApp.corGeral} logoIconeApp={configApp.logoIconeApp} />}>
        <Drawer.Screen name="Tabs" component={Tabs} />
        {menuLateral.map((screen, index) => (
          <Drawer.Screen
            key={index}
            name={screen.name}
            component={screen.type === 'webview' ? WebViewScreen : screen.type === 'lista' ? ListScreen : DynamicScreen}
            initialParams={screen}
            options={{
              drawerIcon: ({ focused, color, size }) => (
                <Icon name={screen.icon} color={color} size={size} />
              )
            }}
          />
        ))}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
