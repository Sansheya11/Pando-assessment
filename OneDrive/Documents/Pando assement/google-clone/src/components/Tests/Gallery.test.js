import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import Gallery from "../Gallery";
import '@testing-library/jest-dom';

jest.mock("axios");

const mockPhotos = [
  {
    _id: "1",
    title: "Sunset",
    filename: "sunset.jpg",
    tags: ["nature"],
    favorite: false,
  },
  {
    _id: "2",
    title: "Mountains",
    filename: "mountains.jpg",
    tags: ["travel"],
    favorite: true,
  }
];

const mockAlbums = [
  { _id: "a1", name: "Nature" },
  { _id: "a2", name: "Travel" }
];

describe("Gallery component", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/photos")) return Promise.resolve({ data: mockPhotos });
      if (url.includes("/api/albums")) return Promise.resolve({ data: mockAlbums });
      return Promise.reject(new Error("not found"));
    });
  });

  test("renders gallery with photos and times", async () => {
    render(<Gallery />);

    expect(await screen.findByText("Sunset")).toBeInTheDocument();
    expect(screen.getByText("Mountains")).toBeInTheDocument();
    expect(screen.getAllByText(/Uploaded at:/).length).toBeGreaterThan(0);
  });

  test("search filters results", async () => {
    render(<Gallery />);
    await screen.findByText("Sunset");

    fireEvent.change(screen.getByPlaceholderText("Search photos..."), {
      target: { value: "Mountains" }
    });

    await waitFor(() => {
      expect(screen.queryByText("Sunset")).not.toBeInTheDocument();
      expect(screen.getByText("Mountains")).toBeInTheDocument();
    });
  });
});
