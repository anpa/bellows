import React, { useState, useRef, useEffect } from "react";
import convert from "convert-length";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

const DEFAULT_IMAGE_URL = "http://placekitten.com/217/701";

// Sizes in mm
const PRINT_SIZES = {
  a1: { height: 594, width: 841 },
  a2: { height: 420, width: 594 },
  a3: { height: 297, width: 420 },
  a4: { height: 210, width: 297 },
};

const getSize = (name) => PRINT_SIZES[name];

function App() {
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  const [sheetSize, setSheetSize] = useState("a3");
  const [stripeWidthMm, setStripeWidthMm] = useState(20);
  const [stripeHeightMm, setStripeHeightMm] = useState(330);
  const [offsetSizeMm, setOffsetSizeMm] = useState(4);
  const [numberOfStripes, setNumberOfStripes] = useState(19);
  const [previewMode, setPreviewMode] = useState("final");

  const canvasRef = useRef(null);

  const scale = 1;
  const lineWidthPx = 1;

  // Height of the sheet
  const heightMm = getSize(sheetSize).height;
  const heightPx = convert(heightMm, "mm", "px");
  const heightScaledPx = heightPx * scale;

  // Width of the sheet
  const widthMm = getSize(sheetSize).width;
  const widthPx = convert(widthMm, "mm", "px");
  const widthScaledPx = widthPx * scale;

  // Width of each strip
  const stripeWidthPx = convert(stripeWidthMm, "mm", "px");
  const stripWidthScaledPx = stripeWidthPx * scale;

  // Height of each strip
  const stripeHeightPx = convert(stripeHeightMm, "mm", "px");
  const stripHeightScaledPx = stripeHeightPx * scale;

  // Width of the offset
  const offsetSizePx = convert(offsetSizeMm, "mm", "px");
  const offsetSizeScaledPx = offsetSizePx * scale;

  // Best width for the original image
  const bestWidthMm = (numberOfStripes - 1) * offsetSizeMm + stripeWidthMm;
  const bestWidthPx = convert(bestWidthMm, "mm", "px");
  const bestWidthScaledPx = bestWidthPx * scale;

  // Final width
  const finalWidthPx = numberOfStripes * stripeWidthPx;
  const finalWidthScaledPx = finalWidthPx * scale;
  const finalWidthWithLinesScaledPx = finalWidthScaledPx + ((numberOfStripes - 1) * lineWidthPx);
  const finalWidthWithLinesMm = convert(finalWidthWithLinesScaledPx / scale, "px", "mm");

  console.log("bestWidthMm:", bestWidthMm);
  console.log("bestWidthPx:", bestWidthPx);
  console.log("widthMm:", widthMm);
  console.log("widthPx:", widthPx);
  console.log("widthScaledPx:", widthScaledPx);
  console.log("stripeWidthMm: ", stripeWidthMm);
  console.log("stripeWidthPx: ", stripeWidthPx);
  console.log("stripWidthScaledPx: ", stripWidthScaledPx);
  console.log("offsetSizeScaledPx:", offsetSizeScaledPx);
  console.log("finalWidthPx: ", finalWidthPx);
  console.log("finalWidthScaledPx: ", finalWidthScaledPx);
  console.log("finalWidthWithLinesScaledPx:", finalWidthWithLinesScaledPx);


  const downloadPdf = () => {
    // only jpeg is supported by jsPDF
    var imgData = canvasRef.current.toDataURL("image/jpeg", 1.0);
    const { jsPDF } = window.jspdf;
    var pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: sheetSize,
    });

    pdf.addImage(imgData, "JPEG", 0, 0);

    // Open new window
    pdf.output("dataurlnewwindow");
    // Download
    // pdf.save("download.pdf");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = bestWidthScaledPx;
    canvas.height = stripHeightScaledPx;

    // Paint canvas to start with
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // 1. Draw image
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Calculate image stripes taking into account the offset
      const stripes = [];

      for (let i = 0; i < numberOfStripes; i++) {
        stripes.push(
          context.getImageData(
            offsetSizeScaledPx * i, // start point x
            0, // start point y
            stripWidthScaledPx, // width
            stripHeightScaledPx // height
          )
        );
      }
      context.clearRect(0, 0, canvas.width, canvas.height);

      // 3. Put all stripes together
      canvas.width = finalWidthWithLinesScaledPx;
      context.fillStyle = "#f00";
      context.fillRect(0, 0, canvas.width, canvas.height);

      let pos = 0;

      stripes.forEach((stripe, i) => {
        const stripePosStart = pos;
        const stripePosEnd = stripePosStart + stripe.width - 1;
        const linePosStart = stripePosEnd + 1;
        const linePosEnd = linePosStart + lineWidthPx - 1;

        // Draw stripe
        context.putImageData(stripe, pos, 0);
        
        // Draw vertical line
        context.fillStyle = "#fff";
        context.fillRect(linePosStart, 0, lineWidthPx, stripe.height);

        console.log(`Stripe: (${stripePosStart}, ${stripePosEnd}) Line: (${linePosStart},${linePosEnd})`);

        pos = linePosEnd + 1;
      });
    };
    img.src = imageUrl;
  }, [
    imageUrl,
    stripWidthScaledPx,
    stripHeightScaledPx,
    offsetSizeScaledPx,
    numberOfStripes,
  ]);

  return (
    <div className="app">
      <div className="controls">
        <Typography variant="h4" component="h1">
          Bellows
        </Typography>

        <Typography variant="subtitle1" sx={{marginBottom: "30px"}}>
          Ferramenta de customização de foles
        </Typography>

        {/* Stripes */}

        <section className="group">
          <div className="field">
            <FormControl>
              <TextField
                label="Numero de tiras:"
                variant="outlined"
                id="stripes"
                type="number"
                defaultValue={numberOfStripes}
                onChange={(e) =>
                  setNumberOfStripes(e.target.valueAsNumber || 1)
                }
              />
            </FormControl>
          </div>

          <div className="field">
            <FormControl>
              <TextField
                label="Largura das tiras (mm):"
                variant="outlined"
                id="stripes-width"
                type="number"
                defaultValue={stripeWidthMm}
                onChange={(e) => setStripeWidthMm(e.target.valueAsNumber || 1)}
              />
            </FormControl>
          </div>

          <div className="field">
            <FormControl>
              <TextField
                label="Altura das tiras (mm):"
                variant="outlined"
                id="stripes-height"
                type="number"
                defaultValue={stripeHeightMm}
                onChange={(e) => setStripeHeightMm(e.target.valueAsNumber || 1)}
              />
            </FormControl>
          </div>

          <div className="field">
            <FormControl>
              <TextField
                label="Offset da imagem (mm):"
                variant="outlined"
                id="offset-width"
                type="number"
                min="0"
                defaultValue={offsetSizeMm}
                onChange={(e) => setOffsetSizeMm(e.target.valueAsNumber || 0)}
              />
            </FormControl>
          </div>
        </section>

        {/* Image */}

        <section className="group">
          <Button variant="contained" component="label">
            Escolher imagem
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={(e) =>
                setImageUrl(URL.createObjectURL(e.target.files[0]))
              }
            />
          </Button>

          <Typography
            variant="body2"
            gutterBottom
            paragraph
            sx={{ marginTop: "1em", fontWeight: "300" }}
          >
            Recomendação: {bestWidthPx}px x {stripeHeightPx} px ({bestWidthMm}mm x {stripeHeightMm}mm)
          </Typography>
        </section>

        {/* Output */}

        <section className="group">
          <div className="field">
            <FormControl>
              <InputLabel htmlFor="sheet">Tamanho da folha:</InputLabel>
              <Select
                id="sheet"
                label="Tamanho da folha:"
                defaultValue={sheetSize}
                onChange={(e) => setSheetSize(e.target.value)}
              >
                <MenuItem value="a1">A1 - 84.1 x 59.4 cm</MenuItem>
                <MenuItem value="a2">A2 - 59.4 x 42 cm</MenuItem>
                <MenuItem value="a3">A3 - 42 x 29.7 cm</MenuItem>
                <MenuItem value="a4">A4 - 29.7 x 21 cm</MenuItem>
              </Select>
            </FormControl>
          </div>

          <Typography
            variant="body2"
            gutterBottom
            paragraph
            sx={{ marginTop: "1em", fontWeight: "300" }}
          >
            Tamanho final: {Math.ceil(finalWidthWithLinesMm)}mm x {stripeHeightMm}mm
          </Typography>

          <div className="download-button">
            <Button size="large" onClick={downloadPdf} variant="contained">
              Imprimir
            </Button>
          </div>
        </section>
      </div>

      <div className="preview">
        <div className="preview-mode-buttons">
          <ToggleButtonGroup
            color="primary"
            value={previewMode}
            exclusive
            onChange={(e, value) => setPreviewMode(value)}
            aria-label="Modo de visualização"
          >
            <ToggleButton value="original">Original</ToggleButton>
            <ToggleButton value="final">Resultado Final</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div
          className={`original-preview ${
            previewMode === "original" ? "" : "hidden"
          }`}
        >
          <img src={imageUrl} />
        </div>

        <div
          className={`final-preview ${previewMode === "final" ? "" : "hidden"}`}
        >
          <canvas ref={canvasRef} className="canvas" />
        </div>
      </div>
    </div>
  );
}

export default App;
