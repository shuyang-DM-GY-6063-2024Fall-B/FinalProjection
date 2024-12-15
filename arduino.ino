#include <ArduinoJson.h>
void sendData(int d1Val, int d2Val, int d3Val, int d4Val) {
  StaticJsonDocument<128> resJson;
  JsonObject data = resJson.createNestedObject("data");

  data["D1"] = d1Val;
  data["D2"] = d2Val;
  data["D3"] = d3Val;
  data["D4"] = d4Val;

  String resTxt = "";
  serializeJson(resJson, resTxt);
  Serial.println(resTxt);
}

void setup() {
  Serial.begin(9600);
  while (!Serial) {}

  pinMode(1, INPUT);
  pinMode(2, INPUT);
  pinMode(3, INPUT);
  pinMode(4, INPUT);
}

void loop() {
  int d1Val = digitalRead(1);
  int d2Val = digitalRead(2);
  int d3Val = digitalRead(3);
  int d4Val = digitalRead(4);

  if (Serial.available() > 0) {
    int byteIn = Serial.read();
    if (byteIn == 0xAB) { 
      Serial.flush();
      sendData(d1Val, d2Val, d3Val, d4Val);
    }
  }

  delay(500);
}
