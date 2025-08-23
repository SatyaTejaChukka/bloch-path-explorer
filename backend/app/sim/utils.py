# Utility functions for Bloch Path Explorer

import numpy as np
from typing import List, Tuple

def normalize_vector(vector: np.ndarray) -> np.ndarray:
    """
    Normalize a vector to unit length
    """
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm

def calculate_distance(point1: Tuple[float, float, float], point2: Tuple[float, float, float]) -> float:
    """
    Calculate Euclidean distance between two points on the Bloch sphere
    """
    return np.sqrt((point1[0] - point2[0])**2 + 
                   (point1[1] - point2[1])**2 + 
                   (point1[2] - point2[2])**2)

def generate_bloch_path(start_point: Tuple[float, float, float], 
                       end_point: Tuple[float, float, float], 
                       num_points: int = 100) -> List[Tuple[float, float, float]]:
    """
    Generate a path between two points on the Bloch sphere
    """
    path = []
    for i in range(num_points):
        t = i / (num_points - 1)
        point = (
            start_point[0] * (1 - t) + end_point[0] * t,
            start_point[1] * (1 - t) + end_point[1] * t,
            start_point[2] * (1 - t) + end_point[2] * t
        )
        # Normalize to ensure points lie on the sphere
        point = normalize_vector(np.array(point))
        path.append(tuple(point))
    
    return path
