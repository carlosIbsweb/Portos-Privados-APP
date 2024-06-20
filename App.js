import 'react-native-gesture-handler';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, Image, StatusBar, FlatList, TouchableOpacity } from 'react-native';
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
  const { url } = route.params;
  return <WebView source={{ uri: url }} style={{ flex: 1 }} />;
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
          <TouchableOpacity onPress={() => navigation.navigate('ItemDetail', { item })}>
            <Text style={{ fontSize: 16, padding: 8 }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: item.name,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
          <Icon name="arrow-left" size={25} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, item]);

  if (item.type === 'webview') {
    return <WebView source={{ uri: item.url }} style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{item.name} Screen</Text>
      <Text>{item.descrição}</Text>
    </View>
  );
}

function CustomDrawerContent(props) {
  const { corGeral, logoIconeApp, titleSite } = props;

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
        <Image source={{ uri: logoIconeApp }} style={{ width: 50, height: 50, marginRight: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: corGeral }}>{titleSite}</Text>
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

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ListScreen" component={ListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </Stack.Navigator>
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
            component={screen.type === 'webview' ? WebViewScreen : screen.type === 'lista' ? HomeStack : DynamicScreen}
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
      <Drawer.Navigator drawerContent={props => <CustomDrawerContent {...props} corGeral={configApp.corGeral} logoIconeApp={configApp.logoIconeApp} titleSite={configApp.titleSite} />}>
        <Drawer.Screen name="Home" component={Tabs} />
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
          <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
