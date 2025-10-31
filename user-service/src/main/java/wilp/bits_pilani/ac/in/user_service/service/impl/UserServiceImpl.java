package wilp.bits_pilani.ac.in.user_service.service.impl;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import wilp.bits_pilani.ac.in.user_service.domain.dto.UserRegistrationDto;
import wilp.bits_pilani.ac.in.user_service.domain.entity.User;
import wilp.bits_pilani.ac.in.user_service.repository.UserRepository;
import wilp.bits_pilani.ac.in.user_service.service.UserService;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final BCryptPasswordEncoder encoder;

    public UserServiceImpl(UserRepository userRepository, BCryptPasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.encoder = encoder;
    }


    @Override
    public User registerUser(UserRegistrationDto dto) {
        // Check if email exists
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(encoder.encode(dto.getPassword())) // Encrypt password
                .phone(dto.getPhone())
                .build();
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
