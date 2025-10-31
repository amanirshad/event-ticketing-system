package wilp.bits_pilani.ac.in.user_service.service;

import wilp.bits_pilani.ac.in.user_service.domain.dto.UserRegistrationDto;
import wilp.bits_pilani.ac.in.user_service.domain.entity.User;

import java.util.Optional;

public interface UserService {
    public User registerUser(UserRegistrationDto dto);
    public Optional<User> findByEmail(String email);
    Optional<User> findById(Long id);
}
