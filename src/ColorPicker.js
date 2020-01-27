import React from "react";
import { CustomPicker } from "react-color";
import {
  EditableInput,
  Hue,
  Saturation
} from "react-color/lib/components/common";

export const MyPicker = ({ hex, hsl, hsv, onChange }) => {
  const styles = {
    hue: {
      height: 10,
      width: "100%",
      position: "relative",
      marginBottom: 10,
      marginTop: 10
    },
    saturation: {
      width: "100%",
      height: 60,
      position: "relative",
      marginBottom: 10
    },
    input: {
      height: 24,
      width: "100%",
      fontSize: 12, 
      padding: 2,
      color: "#737d80",
      display: "inline-block",
      textAlign: "center"
    },
  };
  return (
    <div>
      <div style={styles.hue}>
        <Hue hsl={hsl} onChange={onChange} />
      </div>

      <div style={styles.saturation}>
        <Saturation hsl={hsl} hsv={hsv} onChange={onChange} />
      </div>

      <div style={{ display: "flex" }}>
        <EditableInput
          style={{ input: styles.input }}
          value={hex}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default CustomPicker(MyPicker);
