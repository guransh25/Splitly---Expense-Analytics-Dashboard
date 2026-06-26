package com.splitly.service;

import com.splitly.dto.Dtos.*;
import com.splitly.entity.*;
import com.splitly.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groups;
    private final GroupMemberRepository members;
    private final UserRepository users;

    @Transactional
    public Group create(Long userId, String name) {
        Group g = groups.save(Group.builder().name(name).createdBy(userId).build());
        members.save(GroupMember.builder().groupId(g.getId()).userId(userId).build());
        return g;
    }

    public List<Group> listForUser(Long userId) {
        return groups.findAllForUser(userId);
    }

    public GroupDetailResponse detail(Long userId, Long groupId) {
        Group g = groups.findById(groupId).orElseThrow();
        if (!members.existsByGroupIdAndUserId(groupId, userId) && !g.getCreatedBy().equals(userId))
            throw new SecurityException("Not a member of this group");
        List<GroupMember> gm = members.findByGroupId(groupId);
        Map<Long, User> userMap = new HashMap<>();
        users.findAllById(gm.stream().map(GroupMember::getUserId).toList())
             .forEach(u -> userMap.put(u.getId(), u));
        List<UserResponse> ms = gm.stream()
            .map(m -> {
                User u = userMap.get(m.getUserId());
                return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl());
            }).toList();
        return new GroupDetailResponse(
            new GroupResponse(g.getId(), g.getName(), g.getCreatedBy(), g.getCreatedAt().toString()),
            ms);
    }

    @Transactional
    public void addMemberByEmail(Long actorId, Long groupId, String email) {
        Group g = groups.findById(groupId).orElseThrow();
        if (!g.getCreatedBy().equals(actorId))
            throw new SecurityException("Only the group creator can add members");
        User u = users.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("No user with that email"));
        if (members.existsByGroupIdAndUserId(groupId, u.getId())) return;
        members.save(GroupMember.builder().groupId(groupId).userId(u.getId()).build());
    }
}
