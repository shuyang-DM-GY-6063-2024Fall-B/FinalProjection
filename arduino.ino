#include <ArduinoJson.h>

void setup() {
  Serial.begin(9600); 
  pinMode(2, INPUT);
  pinMode(3, INPUT);
}

void loop() {
  int d2State = digitalRead(2);
  int d3State = digitalRead(3);

  StaticJsonDocument<128> jsonDoc;
  JsonObject data = jsonDoc.createNestedObject("data");
  data["D2"] = d2State;
  data["D3"] = d3State;

  String output;
  serializeJson(jsonDoc, output);
  Serial.println(output);

  delay(200); 
}
