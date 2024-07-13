import React, { useState, useRef, useEffect } from "react";
import { generateStory } from "./api/gemini";
import { generateImage } from "./api/imageGenerator";
import { FaBook, FaDownload, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BookPage = React.forwardRef(({ children, pageNumber, isCover }, ref) => (
  <div
    ref={ref}
    className={`bg-amber-50 shadow-xl rounded-lg overflow-hidden mx-auto my-8 border-4 border-amber-900 ${
      isCover ? "relative" : ""
    }`}
    style={{
      width: "595px",
      height: "842px",
      pageBreakAfter: "always",
    }}
  >
    <div className={`${isCover ? "absolute inset-0" : "p-8 h-full relative"}`}>
      {children}
      {!isCover && pageNumber && (
        <div className="absolute bottom-4 right-4 text-amber-900 font-serif">
          {pageNumber}
        </div>
      )}
    </div>
  </div>
));

function App() {
  const [prompt, setPrompt] = useState("");
  const [storyParagraphs, setStoryParagraphs] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const bookRef = useRef();
  const speechSynthesis = window.speechSynthesis;
  const speechUtterance = useRef(new SpeechSynthesisUtterance());
  const [rateExceeded, setRateExceeded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStoryParagraphs([]);
    setImages([]);
    setError(null);
    setRateExceeded(false);

    try {
      const fullStory = await generateStory(
        `Generate a short story with 3 paragraphs and a title based on this prompt: ${prompt}`
      );
      const [storyTitle, ...paragraphs] = fullStory
        .split("\n\n")
        .filter((p) => p.trim() !== "");
      setTitle(
        storyTitle
          .replace("Title: ", "")
          .replace(/\*\*|##/g, "")
          .trim()
      );
      setStoryParagraphs(paragraphs);

      // Generate cover image
      const coverImageUrl = await generateImage(
        `Create a vivid, artistic 3D book cover image for a story titled "${title}"`
      );
      setImages([coverImageUrl]);

      // Generate paragraph images
      for (let i = 0; i < paragraphs.length; i++) {
        const imageUrl = await generateImage(
          `Create a detailed, vivid 3D image for this paragraph: ${paragraphs[i]}`
        );
        setImages((prevImages) => [...prevImages, imageUrl]);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      if (error.response && error.response.status === 429) {
        setRateExceeded(true);
        setError(
          "Rate limit exceeded. Please wait a moment before trying again."
        );
      } else {
        setError(
          "An error occurred while generating the story. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      const fullText = `${title}. ${storyParagraphs.join(" ")}`;
      speechUtterance.current.text = fullText;
      speechSynthesis.speak(speechUtterance.current);
      setSpeaking(true);
    }
  };

  useEffect(() => {
    speechUtterance.current.onend = () => setSpeaking(false);
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const generatePDF = async () => {
    setGenerating(true);
    const pdf = new jsPDF("p", "pt", "a4");
    const pagesContainer = bookRef.current;
    const pages = pagesContainer.children;

    try {
      // Wait for all images to load
      await Promise.all(
        Array.from(pagesContainer.getElementsByTagName("img")).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve; // Also resolve on error to prevent hanging
              }
            })
        )
      );

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        if (i > 0) pdf.addPage();

        pdf.addImage(imgData, "JPEG", 0, 0, 595, 842);
      }

      pdf.save("story_book.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("An error occurred while generating the PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-100 py-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-6 rounded-t-lg shadow-lg">
          <h1 className="text-4xl font-bold text-center flex items-center justify-center font-serif">
            <FaBook className="mr-4" /> AI Story Book Generator
          </h1>
        </div>
        <div className="bg-amber-50 p-6 rounded-b-lg shadow-md border-x-2 border-b-2 border-amber-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a story prompt"
              className="w-full px-4 py-2 border-2 border-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-700 bg-amber-50 text-amber-900"
              required
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-amber-700 text-white rounded-md hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition duration-300 font-serif"
              disabled={loading}
            >
              {loading ? "Crafting Your Tale..." : "Create Your Story"}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {rateExceeded && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Rate limit exceeded. Please wait a moment before generating more
          images.
        </div>
      )}

      {storyParagraphs.length > 0 && (
        <div ref={bookRef} className="mt-8">
          {/* Cover Page */}
          <BookPage isCover={true}>
            <div
              className="h-full w-full bg-cover bg-center relative"
              style={{ backgroundImage: `url(${images[0]})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center">
                <h2 className="text-5xl font-bold text-center font-serif text-white mb-4 px-4">
                  {title}
                </h2>
                <p className="text-2xl font-serif text-white">
                  A Tale Generated by AI
                </p>
              </div>
            </div>
          </BookPage>

          {/* Content Pages */}
          {storyParagraphs.map((paragraph, index) => (
            <BookPage key={index} pageNumber={index + 1}>
              <p className="text-amber-900 text-lg leading-relaxed mb-4 font-serif">
                {paragraph}
              </p>
              {images[index + 1] && (
                <div
                  className="w-full flex-grow bg-amber-100 rounded-lg overflow-hidden border-2 border-amber-900 mt-4"
                  style={{ height: "500px" }}
                >
                  <img
                    src={images[index + 1]}
                    alt={`Illustration for paragraph ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("Error loading image:", e);
                      e.target.src = "/path/to/fallback/image.jpg"; // Provide a fallback image
                    }}
                  />
                </div>
              )}
            </BookPage>
          ))}
        </div>
      )}

      {storyParagraphs.length > 0 && (
        <div className="flex space-x-4 mt-4">
          <button
            onClick={generatePDF}
            className="py-2 px-4 bg-amber-700 text-white rounded-md hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition duration-300 flex items-center font-serif"
            disabled={generating}
          >
            {generating ? (
              "Generating PDF..."
            ) : (
              <>
                <FaDownload className="mr-2" /> Download PDF
              </>
            )}
          </button>
          <button
            onClick={handleSpeak}
            className={`py-2 px-4 ${
              speaking
                ? "bg-red-700 hover:bg-red-800"
                : "bg-amber-700 hover:bg-amber-800"
            } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition duration-300 flex items-center font-serif`}
          >
            {speaking ? (
              <FaVolumeMute className="mr-2" />
            ) : (
              <FaVolumeUp className="mr-2" />
            )}
            {speaking ? "Stop Narration" : "Read Aloud"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
