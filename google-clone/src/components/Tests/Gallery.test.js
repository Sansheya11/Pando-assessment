import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import dayjs from "dayjs";
import Gallery from "../Gallery";
import '@testing-library/jest-dom';

jest.mock("axios");

const mockPhotos = [
  {
    _id: "1",
    filename: "photo1.jpg",
    originalname: "vacation.jpg",
    title: "Beach Vacation",
    createdAt: dayjs().subtract(5, "minute").toISOString(),
    tags: ["beach", "vacation"],
    favorite: true,
    url: "/uploads/photo1.jpg"
  },
  {
    _id: "2",
    filename: "photo2.jpg",
    originalname: "family.jpg",
    title: "Family Gathering",
    createdAt: dayjs().subtract(20, "minute").toISOString(),
    tags: ["family", "party"],
    favorite: false,
    url: "/uploads/photo2.jpg"
  },
  {
    _id: "3",
    filename: "photo3.jpg",
    originalname: "work.jpg",
    title: "Work Meeting",
    createdAt: dayjs().subtract(2, "hour").toISOString(),
    tags: ["work", "office"],
    favorite: false,
    url: "/uploads/photo3.jpg"
  }
];

const mockAlbums = [
  { _id: "album1", name: "Vacation 2024" },
  { _id: "album2", name: "Family Photos" }
];

describe("Gallery component", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes("/photos")) {
        return Promise.resolve({ data: mockPhotos });
      }
      if (url.includes("/albums")) {
        return Promise.resolve({ data: mockAlbums });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  test("renders gallery with photos and timeline groups", async () => {
    render(<Gallery />);

    // Check if the header is rendered
    expect(screen.getByText("Photo Timeline")).toBeInTheDocument();
    
    // Wait for photos to load
    await waitFor(() => {
      expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    });

    // Check timeline groups
    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("15 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  test("handles photo search correctly", async () => {
    render(<Gallery />);

    // Wait for photos to load
    await waitFor(() => {
      expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    });

    // Get search input
    const searchInput = screen.getByPlaceholderText("Search photos...");

    // Search for "beach"
    userEvent.type(searchInput, "beach");

    // Check if only beach photo is shown
    expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    expect(screen.queryByText("Family Gathering")).not.toBeInTheDocument();
  });

  test("toggles photo favorite status", async () => {
    render(<Gallery />);

    // Wait for photos to load
    await waitFor(() => {
      expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    });

    // Mock the favorite toggle API call
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    // Find and click the favorite button for Beach Vacation
    const favoriteButtons = screen.getAllByText("★");
    fireEvent.click(favoriteButtons[0]);

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:9001/api/photos/favorite/1"
    );
  });

  test("deletes photo after confirmation", async () => {
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, "confirm");
    mockConfirm.mockImplementation(() => true);

    render(<Gallery />);

    // Wait for photos to load
    await waitFor(() => {
      expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    });

    // Mock the delete API call
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    // Find and click delete button
    const deleteButtons = screen.getAllByText("🗑️");
    fireEvent.click(deleteButtons[0]);

    // Verify confirmation was shown
    expect(mockConfirm).toHaveBeenCalled();

    // Verify API call
    expect(axios.delete).toHaveBeenCalledWith(
      "http://localhost:9001/api/photos/1"
    );

    // Cleanup
    mockConfirm.mockRestore();
  });

  test("adds photo to album", async () => {
    render(<Gallery />);

    // Wait for photos to load
    await waitFor(() => {
      expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    });

    // Mock the add to album API call
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    // Find and interact with album select
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "album1" } });

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:9001/api/albums/album1/add",
      { photoId: "1" }
    );
  });

  test("handles API errors gracefully", async () => {
    // Mock console.error to avoid cluttering test output
    const mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock failed API calls
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<Gallery />);

    // Wait for error handling
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
    });

    // Cleanup
    mockConsoleError.mockRestore();
  });

  test("updates photos list after operations", async () => {
    render(<Gallery />);

    // Wait for initial photos load
    await waitFor(() => {
      expect(screen.getByText("Beach Vacation")).toBeInTheDocument();
    });

    // Mock successful delete operation
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    // Mock the subsequent photos fetch with one photo removed
    const updatedPhotos = mockPhotos.slice(1);
    axios.get.mockResolvedValueOnce({ data: updatedPhotos });

    // Trigger delete
    const mockConfirm = jest.spyOn(window, "confirm");
    mockConfirm.mockImplementation(() => true);
    const deleteButtons = screen.getAllByText("🗑️");
    fireEvent.click(deleteButtons[0]);

    // Verify photo list is updated
    await waitFor(() => {
      expect(screen.queryByText("Beach Vacation")).not.toBeInTheDocument();
    });

    // Cleanup
    mockConfirm.mockRestore();
  });
});
