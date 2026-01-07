const express = require("express");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const path = require("path");

const router = express.Router();

// Load service account key (downloaded JSON)
const client = new ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../vision-key.json"),
});

// POST route to process image
router.post("/analyze", async (req, res) => {
  try {
    const { imageUrl, totalChairs } = req.body;

    if (!imageUrl || !totalChairs) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageUrl and totalChairs' 
      });
    }

    console.log('Analyzing image:', imageUrl);
    console.log('Total chairs:', totalChairs);

    // Send image to Vision API
    const [result] = await client.objectLocalization(imageUrl);
    const objects = result.localizedObjectAnnotations;

    // Count people detected
    const peopleCount = objects.filter(obj => obj.name.toLowerCase() === "person").length;

    // Calculate available chairs and attendance percentage
    const availableChairs = totalChairs - peopleCount;
    const attendancePercentage = Math.round((peopleCount / totalChairs) * 100);

    const response = {
      success: true,
      analysis: {
        totalChairs,
        peopleCount,
        availableChairs,
        attendancePercentage,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Analysis result:', response);
    res.json(response);
  } catch (err) {
    console.error('Vision API Error:', err);
    res.status(500).json({ 
      error: "Failed to analyze image",
      details: err.message 
    });
  }
});

module.exports = router;